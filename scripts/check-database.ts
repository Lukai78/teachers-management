import { prisma } from '../lib/prisma';

async function checkDatabase() {
    try {
        // Count teachers
        const teacherCount = await prisma.teacher.count();
        console.log(`\n${'='.repeat(60)}`);
        console.log(`DATABASE SUMMARY`);
        console.log('='.repeat(60));
        console.log(`Total teachers: ${teacherCount}`);

        // Get all teachers
        const teachers = await prisma.teacher.findMany({
            include: {
                _count: {
                    select: { scheduleSlots: true }
                }
            }
        });

        console.log(`\nTeacher List:`);
        teachers.forEach((teacher, index) => {
            console.log(`${index + 1}. ${teacher.name} (${teacher.email}) - ${teacher._count.scheduleSlots} slots`);
        });

        // Sample schedule slots
        const sampleSlots = await prisma.scheduleSlot.findMany({
            take: 10,
            include: {
                teacher: true
            }
        });

        console.log(`\n${'='.repeat(60)}`);
        console.log(`SAMPLE SCHEDULE SLOTS (first 10):`);
        console.log('='.repeat(60));
        sampleSlots.forEach(slot => {
            console.log(`${slot.teacher.name} | ${slot.dayOfWeek} ${slot.startTime}-${slot.endTime} | ${slot.subject} | ${slot.classRoom || 'N/A'}`);
        });

        // Get total slots count
        const slotsCount = await prisma.scheduleSlot.count();
        console.log(`\n${'='.repeat(60)}`);
        console.log(`Total schedule slots: ${slotsCount}`);
        console.log('='.repeat(60));

    } catch (error) {
        console.error('Error checking database:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkDatabase();
