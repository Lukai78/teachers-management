import { prisma } from '../lib/prisma';

async function clearDatabase() {
    console.log('\nClearing database...');

    // Delete in correct order (due to foreign key constraints)
    await prisma.coverAssignment.deleteMany({});
    console.log('✓ Deleted cover assignments');

    await prisma.absence.deleteMany({});
    console.log('✓ Deleted absences');

    await prisma.scheduleSlot.deleteMany({});
    console.log('✓ Deleted schedule slots');

    await prisma.teacher.deleteMany({});
    console.log('✓ Deleted teachers');

    console.log('\n✅ Database cleared successfully!');

    await prisma.$disconnect();
}

clearDatabase();
