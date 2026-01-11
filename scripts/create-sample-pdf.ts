import { jsPDF } from "jspdf";
import fs from 'fs';
import path from 'path';

const doc = new jsPDF({ compress: false });

doc.text("Teacher: John Doe", 10, 10);
doc.text("Monday 09:00 10:00 Math Room 101", 10, 20);
doc.text("Tuesday 10:00 11:00 Science Lab 1", 10, 30);

doc.text("Teacher: Jane Smith", 10, 50);
doc.text("Wednesday 13:00 14:00 History Room 202", 10, 60);

// Use string output and convert to binary buffer (the fix we found)
const pdfString = doc.output();
const pdfBuffer = Buffer.from(pdfString, 'binary');

const outputPath = path.join(process.cwd(), 'sample-upload.pdf');
fs.writeFileSync(outputPath, pdfBuffer);
console.log('Sample PDF created at:', outputPath);
