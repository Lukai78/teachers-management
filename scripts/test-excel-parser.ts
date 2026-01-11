import { parseScheduleExcel } from '../lib/excel-parser';
import * as fs from 'fs';
import * as path from 'path';

async function testParser() {
    const filePath = path.join(__dirname, '..', 'teacher-schedule.xlsx');
    const buffer = fs.readFileSync(filePath);

    console.log('Testing Excel parser...\n');

    try {
        const schedules = await parseScheduleExcel(buffer);

        console.log(`\n${'='.repeat(60)}`);
        console.log(`SUMMARY: Parsed ${schedules.length} teacher schedules`);
        console.log('='.repeat(60));

        // Show summary for each teacher
        schedules.forEach((schedule, index) => {
            console.log(`\n${index + 1}. ${schedule.teacherName}`);
            console.log(`   Total slots: ${schedule.slots.length}`);

            // Group by day
            const byDay: Record<string, number> = {};
            schedule.slots.forEach(slot => {
                if (!byDay[slot.dayOfWeek]) byDay[slot.dayOfWeek] = 0;
                byDay[slot.dayOfWeek]++;
            });

            console.log(`   By day:`, byDay);

            // Show first few slots as examples
            if (schedule.slots.length > 0) {
                console.log(`   First slot: ${schedule.slots[0].dayOfWeek} ${schedule.slots[0].startTime}-${schedule.slots[0].endTime} | ${schedule.slots[0].subject} | ${schedule.slots[0].classRoom}`);
            }
        });

        console.log(`\n${'='.repeat(60)}`);
        console.log('DETAILED VIEW - First 3 Teachers:');
        console.log('='.repeat(60));

        schedules.slice(0, 3).forEach(schedule => {
            console.log(`\nTeacher: ${schedule.teacherName}`);
            console.log('-'.repeat(60));
            schedule.slots.forEach(slot => {
                console.log(`  ${slot.dayOfWeek.padEnd(10)} ${slot.startTime} - ${slot.endTime} | ${slot.subject.padEnd(20)} | ${slot.classRoom}`);
            });
        });

    } catch (error) {
        console.error('ERROR:', error);
        process.exit(1);
    }
}

testParser();
