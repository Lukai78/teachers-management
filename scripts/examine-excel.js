const XLSX = require('xlsx');
const path = require('path');

// Read the Excel file
const filePath = path.join(__dirname, '..', 'teacher-schedule.xlsx');
const workbook = XLSX.readFile(filePath);

console.log('Sheet Names:', workbook.SheetNames);
console.log('\n');

// Examine each sheet
workbook.SheetNames.forEach((sheetName, index) => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Sheet ${index + 1}: ${sheetName}`);
    console.log('='.repeat(60));

    const worksheet = workbook.Sheets[sheetName];
    const range = XLSX.utils.decode_range(worksheet['!ref']);

    console.log(`Range: ${worksheet['!ref']}`);
    console.log(`Rows: ${range.e.r - range.s.r + 1}`);
    console.log(`Columns: ${range.e.c - range.s.c + 1}`);
    console.log('\n');

    // Convert to JSON to see the data
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

    // Show first 20 rows
    console.log('First 20 rows:');
    jsonData.slice(0, 20).forEach((row, i) => {
        console.log(`Row ${i}:`, row);
    });

    console.log('\n');

    // Also show as objects (first 5 records)
    console.log('First 5 records (as objects):');
    const objectData = XLSX.utils.sheet_to_json(worksheet);
    console.log(JSON.stringify(objectData.slice(0, 5), null, 2));
});
