const XLSX = require('xlsx');
const path = require('path');

// Read the Excel file
const filePath = path.join(__dirname, '..', 'teacher-schedule.xlsx');
const workbook = XLSX.readFile(filePath);

console.log(`\nTotal sheets: ${workbook.SheetNames.length}\n`);

// Examine each sheet in detail
workbook.SheetNames.forEach((sheetName, sheetIndex) => {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`Sheet ${sheetIndex + 1}: "${sheetName}"`);
    console.log('='.repeat(80));

    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

    // Show first 30 rows to understand the structure
    console.log('\nFirst 30 rows:');
    data.slice(0, 30).forEach((row, i) => {
        if (row.some(cell => cell)) { // Only show non-empty rows
            console.log(`Row ${i}:`, row.map(c => String(c).substring(0, 50)));
        }
    });

    // Look for teacher names in the data
    console.log('\nSearching for teacher names (cells containing "Ms." or "Mr.")...');
    const teacherNames = new Set();
    data.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
            if (typeof cell === 'string' && (cell.includes('Ms.') || cell.includes('Mr.'))) {
                const lines = cell.split(/\r?\n/);
                lines.forEach(line => {
                    if (line.includes('Ms.') || line.includes('Mr.')) {
                        teacherNames.add(line.trim());
                    }
                });
            }
        });
    });

    if (teacherNames.size > 0) {
        console.log('Found teacher names:', Array.from(teacherNames));
    }
});

console.log('\n' + '='.repeat(80));
console.log('ANALYSIS COMPLETE');
console.log('='.repeat(80));
