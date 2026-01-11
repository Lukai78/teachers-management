import { jsPDF } from "jspdf";
import { parseSchedulePdf } from "../lib/pdf-parser";
import fs from 'fs';
import path from 'path';

async function testParser() {
    console.log('Generating sample PDF...');
    const doc = new jsPDF({ compress: false });

    // Create content that matches our simple parser's expectations
    doc.text("Teacher: John Doe", 10, 10);
    doc.text("Monday 09:00 10:00 Math Room 101", 10, 20);
    doc.text("Tuesday 10:00 11:00 Science Lab 1", 10, 30);

    doc.text("Teacher: Jane Smith", 10, 50);
    doc.text("Wednesday 13:00 14:00 History Room 202", 10, 60);

    // Use string output and convert to binary buffer to avoid "bad XRef entry" with pdf-parse
    const pdfString = doc.output();
    const pdfBuffer = Buffer.from(pdfString, 'binary');

    // Save for manual inspection if needed
    fs.writeFileSync(path.join(__dirname, 'sample.pdf'), pdfBuffer);
    console.log('Sample PDF saved to scripts/sample.pdf');

    console.log('Testing parser...');
    try {
        const schedules = await parseSchedulePdf(pdfBuffer);
        console.log('Parsed Schedules:', JSON.stringify(schedules, null, 2));

        if (schedules.length === 2 &&
            schedules[0].teacherName === 'John Doe' &&
            schedules[0].slots.length === 2 &&
            schedules[0].slots[0].classRoom === 'Room 101') {
            console.log('SUCCESS: Parser extracted correct data.');
        } else {
            console.error('FAILURE: Parser returned unexpected data.');
            console.log('Expected Room 101, got:', schedules[0]?.slots[0]?.classRoom);
            process.exit(1);
        }
    } catch (error) {
        console.error('Error parsing PDF:', error);
        process.exit(1);
    }
}

testParser();
