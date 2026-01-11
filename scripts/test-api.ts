const fs = require('fs');
const path = require('path');

async function testApi() {
    const pdfPath = path.join(__dirname, 'sample.pdf');
    if (!fs.existsSync(pdfPath)) {
        console.error('Sample PDF not found. Run test-parser.ts first.');
        process.exit(1);
    }

    const buffer = fs.readFileSync(pdfPath);
    const blob = new Blob([buffer], { type: 'application/pdf' });
    const formData = new FormData();
    formData.append('file', blob, 'sample.pdf');

    console.log('Uploading PDF to API...');
    try {
        const response = await fetch('http://localhost:3000/api/schedule/upload', {
            method: 'POST',
            body: formData,
        });

        const data = await response.json();
        console.log('Response Status:', response.status);
        console.log('Response Body:', JSON.stringify(data, null, 2));

        if (response.ok && data.success) {
            console.log('SUCCESS: API processed the upload.');
        } else {
            console.error('FAILURE: API returned error.');
            process.exit(1);
        }
    } catch (error) {
        console.error('Error calling API:', error);
        process.exit(1);
    }
}

testApi();
