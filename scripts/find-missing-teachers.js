const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '..', 'teacher-schedule.xlsx');
const workbook = XLSX.readFile(filePath);

console.log(`Total sheets: ${workbook.SheetNames.length}\n`);

// Check each sheet for teacher information
const teachersFound = [];
const sheetsWithoutTeacher = [];

workbook.SheetNames.forEach((sheetName, index) => {
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

    // Look for "Instructor:" pattern
    let foundInstructor = false;
    let teacherName = null;

    for (let i = 0; i < Math.min(10, data.length); i++) {
        const row = data[i];
        for (const cell of row) {
            if (typeof cell === 'string' && cell.includes('Instructor:')) {
                const match = cell.match(/Instructor:\s*(Ms\.|Mr\.)\s*([^(]+)/);
                if (match) {
                    teacherName = `${match[1]} ${match[2].trim()}`;
                    foundInstructor = true;
                    break;
                }
            }
        }
        if (foundInstructor) break;
    }

    if (teacherName) {
        teachersFound.push({ sheet: sheetName, teacher: teacherName });
    } else {
        // Show first few rows to understand structure
        sheetsWithoutTeacher.push({
            sheet: sheetName,
            firstRows: data.slice(0, 8).filter(row => row.some(c => c))
        });
    }
});

console.log(`✅ Sheets WITH teacher names: ${teachersFound.length}`);
teachersFound.forEach(t => console.log(`  - ${t.sheet}: ${t.teacher}`));

console.log(`\n⚠️  Sheets WITHOUT "Instructor:" field: ${sheetsWithoutTeacher.length}`);
sheetsWithoutTeacher.forEach(s => {
    console.log(`\n  Sheet: "${s.sheet}"`);
    console.log('  First rows:');
    s.firstRows.forEach((row, i) => {
        console.log(`    Row ${i}:`, row.slice(0, 3)); // Show first 3 columns
    });
});
