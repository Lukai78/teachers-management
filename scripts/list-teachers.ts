import { prisma } from '../lib/prisma';

async function listTeachers() {
    const teachers = await prisma.teacher.findMany({
        select: {
            name: true,
            email: true
        },
        orderBy: {
            name: 'asc'
        }
    });

    console.log('\n' + '='.repeat(60));
    console.log(`Total Teachers: ${teachers.length}`);
    console.log('='.repeat(60));

    teachers.forEach((teacher, index) => {
        console.log(`${(index + 1)}.`.padStart(4) + ` ${teacher.name}`);
    });

    await prisma.$disconnect();
}

listTeachers();
