import * as fs from 'fs';
import * as path from 'path';
import FormData from 'form-data';
import fetch from 'node-fetch';

async function uploadSchedule() {
    const filePath = path.join(__dirname, '..', 'teacher-schedule.xlsx');

    console.log('\nUploading schedule file...');
    console.log(`File: ${filePath}`);

    // Create form data
    const form = new FormData();
    const fileBuffer = fs.readFileSync(filePath);
    form.append('file', fileBuffer, {
        filename: 'teacher-schedule.xlsx',
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    try {
        const response = await fetch('http://localhost:3000/api/schedule/upload', {
            method: 'POST',
            body: form,
        });

        const data = await response.json();

        if (response.ok) {
            console.log('\n✅ Upload successful!');
            console.log(`Processed ${data.results.length} teachers:`);
            data.results.forEach((result: any) => {
                console.log(`  - ${result.teacher}: ${result.slots} slots`);
            });
        } else {
            console.error('\n❌ Upload failed:');
            console.error(data.error || 'Unknown error');
            process.exit(1);
        }
    } catch (error) {
        console.error('\n❌ Error:', error);
        process.exit(1);
    }
}

uploadSchedule();
