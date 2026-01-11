const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '..', 'teacher-schedule.xlsx');
const workbook = XLSX.readFile(filePath);

console.log('\nExtracting all unique teacher names from Excel...\n');

const teacherNames = new Set();

workbook.SheetNames.forEach(sheetName => {
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

    data.forEach(row => {
        row.forEach(cell => {
            if (typeof cell === 'string') {
                // Pattern 1: "Instructor: Ms./Mr. NAME"
                const instructorMatch = cell.match(/Instructor:\s*(Ms\.|Mr\.)\s*([^(]+)/);
                if (instructorMatch) {
                    const name = `${instructorMatch[1]} ${instructorMatch[2].trim()}`;
                    teacherNames.add(name);
                }

                // Pattern 2: "Subject\r\nMs./Mr. NAME" (from class schedules)
                const lines = cell.split(/\r?\n/);
                lines.forEach(line => {
                    const teacherMatch = line.match(/^\s*(Ms\.|Mr\.)\s*(.+)$/);
                    if (teacherMatch) {
                        const name = `${teacherMatch[1]} ${teacherMatch[2].trim()}`;
                        teacherNames.add(name);
                    }
                });
            }
        });
    });
});

const sortedTeachers = Array.from(teacherNames).sort();

console.log(`Found ${sortedTeachers.length} unique teachers:\n`);
sortedTeachers.forEach((name, index) => {
    console.log(`${(index + 1).toString().padStart(3)}. ${name}`);
});
