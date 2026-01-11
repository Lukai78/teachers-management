// Quick test of the overlap fix
import { prisma } from '../lib/prisma';

async function testOverlapLogic() {
    console.log('\n=== TESTING OVERLAP LOGIC ===\n');

    // Get Daniel Louw
    const teacher = await prisma.teacher.findFirst({
        where: { name: { contains: 'DANIEL' } }
    });

    if (!teacher) {
        console.log('Teacher not found');
        return;
    }

    console.log(`Testing for: ${teacher.name}\n`);

    // Get all teachers
    const allTeachers = await prisma.teacher.count();
    console.log(`Total teachers: ${allTeachers}`);

    // Get all schedules for Monday
    const mondaySchedules = await prisma.scheduleSlot.findMany({
        where: { dayOfWeek: 'Monday' },
        select: {
            teacherId: true,
            startTime: true,
            endTime: true,
            teacher: { select: { name: true } }
        }
    });

    console.log(`Total Monday schedules: ${mondaySchedules.length}`);

    // Check for 8:00 AM - 8:50 AM
    const targetStart = '8:00 AM';
    const targetEnd = '8:50 AM';

    // Helper function to check overlap
    function timesOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
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

        return start1Min < end2Min && start2Min < end1Min;
    }

    // Find busy teachers for 8:00-8:50 AM slot
    const busyTeacherIds = new Set<string>();
    for (const schedule of mondaySchedules) {
        if (timesOverlap(targetStart, targetEnd, schedule.startTime, schedule.endTime)) {
            busyTeacherIds.add(schedule.teacherId);
        }
    }

    console.log(`\nTeachers BUSY during ${targetStart} - ${targetEnd}:`);
    console.log(`Count: ${busyTeacherIds.size}`);

    // Show some examples
    const busyExamples = mondaySchedules
        .filter(s => busyTeacherIds.has(s.teacherId))
        .slice(0, 10);

    busyExamples.forEach(s => {
        console.log(`  - ${s.teacher.name}: ${s.startTime} - ${s.endTime}`);
    });

    console.log(`\nAvailable teachers: ${allTeachers - busyTeacherIds.size}`);

    await prisma.$disconnect();
}
