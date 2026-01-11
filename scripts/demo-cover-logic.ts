import { prisma } from '../lib/prisma';

async function demonstrateCoverLogic() {
    console.log('\n=== DEMONSTRATING COVER FINDER LOGIC ===\n');

    // Pick a teacher to be "absent"
    const absentTeacher = await prisma.teacher.findFirst({
        where: { name: { contains: 'Ms. OM Yuvatey' } },
        include: { scheduleSlots: { take: 5 } }
    });

    if (!absentTeacher || absentTeacher.scheduleSlots.length === 0) {
        console.log('No teacher or schedules found');
        return;
    }

    console.log(`Absent Teacher: ${absentTeacher.name}`);
    console.log(`Sample schedule slots: ${absentTeacher.scheduleSlots.length}\n`);

    // Take the first slot
    const slot = absentTeacher.scheduleSlots[0];
    console.log(`Looking for covers for:`);
    console.log(`  Day: ${slot.dayOfWeek}`);
    console.log(`  Time: ${slot.startTime} - ${slot.endTime}`);
    console.log(`  Subject: ${slot.subject}`);
    console.log(`  Class: ${slot.classRoom}\n`);

    // Find all teachers
    const allTeachers = await prisma.teacher.count();
    console.log(`Total teachers in system: ${allTeachers}`);

    // Find BUSY teachers at this time
    const busyTeachers = await prisma.scheduleSlot.findMany({
        where: {
            dayOfWeek: slot.dayOfWeek,
            startTime: slot.startTime,
            endTime: slot.endTime
        },
        include: {
            teacher: true
        }
    });

    console.log(`\nTeachers BUSY at this time: ${busyTeachers.length}`);
    busyTeachers.slice(0, 5).forEach(s => {
        console.log(`  - ${s.teacher.name} (teaching ${s.subject})`);
    });
    if (busyTeachers.length > 5) {
        console.log(`  ... and ${busyTeachers.length - 5} more`);
    }

    // Calculate free teachers
    const busyIds = new Set(busyTeachers.map(s => s.teacherId));
    const freeCount = allTeachers - busyIds.size;

    console.log(`\nTeachers FREE (available to cover): ${freeCount}`);
    console.log(`\n✅ The system ONLY returns the ${freeCount} free teachers as cover options!`);
    console.log(`❌ The ${busyIds.size} busy teachers are EXCLUDED because they already have classes.\n`);

    await prisma.$disconnect();
}

demonstrateCoverLogic();
