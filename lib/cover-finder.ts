import { prisma } from './prisma';

export interface AvailableTeacher {
    id: string;
    name: string;
    email: string;
}

export interface TimeSlotWithAvailability {
    time: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    subject: string;
    classRoom: string | null;
    availableTeachers: AvailableTeacher[];
}

export interface CoverFinderResult {
    absentTeacher: string;
    date: Date;
    dayOfWeek: string;
    slots: TimeSlotWithAvailability[];
}

/**
 * Get day of week name from date
 */
function getDayOfWeek(date: Date): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
}

/**
 * Find teachers who are free (not scheduled) during a given time slot
 * Excludes teachers who teach Khmer subjects (KH-*)
 * Now properly checks for ANY overlapping schedules, not just exact matches
 */
async function findAvailableTeachersForSlot(
    dayOfWeek: string,
    startTime: string,
    endTime: string,
    excludeTeacherId?: string
): Promise<AvailableTeacher[]> {
    // Get all teachers
    const allTeachers = await prisma.teacher.findMany({
        select: {
            id: true,
            name: true,
            email: true
        }
    });

    // Get ALL schedules for this day
    const allSchedulesThisDay = await prisma.scheduleSlot.findMany({
        where: {
            dayOfWeek
        },
        select: {
            teacherId: true,
            startTime: true,
            endTime: true
        }
    });

    // Helper function to check if two time ranges overlap
    function timesOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
        // Convert times to comparable format (assumes AM/PM format like "8:00 AM")
        const parseTime = (timeStr: string): number => {
            const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
            if (!match) return 0;

            let hours = parseInt(match[1]);
            const minutes = parseInt(match[2]);
            const period = match[3]?.toUpperCase();

            if (period === 'PM' && hours !== 12) hours += 12;
            if (period === 'AM' && hours === 12) hours = 0;

            return hours * 60 + minutes;
        };

        const start1Min = parseTime(start1);
        const end1Min = parseTime(end1);
        const start2Min = parseTime(start2);
        const end2Min = parseTime(end2);

        // Two ranges overlap if one starts before the other ends
        return start1Min < end2Min && start2Min < end1Min;
    }

    // Find teachers who are busy (have overlapping schedules)
    const busyTeacherIds = new Set<string>();
    for (const schedule of allSchedulesThisDay) {
        if (timesOverlap(startTime, endTime, schedule.startTime, schedule.endTime)) {
            busyTeacherIds.add(schedule.teacherId);
        }
    }

    // Get teachers who teach KH subjects (Khmer subjects are not allowed to cover)
    const khTeachers = await prisma.scheduleSlot.findMany({
        where: {
            subject: {
                startsWith: 'KH-'
            }
        },
        select: {
            teacherId: true
        },
        distinct: ['teacherId']
    });

    const khTeacherIds = new Set(khTeachers.map(slot => slot.teacherId));

    // Filter to only free teachers (exclude busy, KH teachers, and absent teacher)
    const availableTeachers = allTeachers.filter(teacher =>
        !busyTeacherIds.has(teacher.id) &&
        !khTeacherIds.has(teacher.id) &&
        (!excludeTeacherId || teacher.id !== excludeTeacherId)
    );

    return availableTeachers;
}

/**
 * Find available teachers for an absence
 */
export async function findAvailableTeachers(absenceId: string): Promise<CoverFinderResult | null> {
    // Get the absence record
    const absence = await prisma.absence.findUnique({
        where: { id: absenceId },
        include: {
            teacher: true
        }
    });

    if (!absence) {
        return null;
    }

    const dayOfWeek = getDayOfWeek(absence.date);

    // Get the absent teacher's schedule for that day
    const teacherSchedule = await prisma.scheduleSlot.findMany({
        where: {
            teacherId: absence.teacherId,
            dayOfWeek
        },
        orderBy: {
            startTime: 'asc'
        }
    });

    // For each slot, find available teachers
    const slotsWithAvailability: TimeSlotWithAvailability[] = [];

    for (const slot of teacherSchedule) {
        const availableTeachers = await findAvailableTeachersForSlot(
            slot.dayOfWeek,
            slot.startTime,
            slot.endTime,
            absence.teacherId
        );

        slotsWithAvailability.push({
            time: `${slot.startTime} - ${slot.endTime}`,
            dayOfWeek: slot.dayOfWeek,
            startTime: slot.startTime,
            endTime: slot.endTime,
            subject: slot.subject,
            classRoom: slot.classRoom,
            availableTeachers
        });
    }

    return {
        absentTeacher: absence.teacher.name,
        date: absence.date,
        dayOfWeek,
        slots: slotsWithAvailability
    };
}
