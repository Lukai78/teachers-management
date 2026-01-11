const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

const pdfPath = path.join(__dirname, 'scripts', 'sample.pdf');

if (!fs.existsSync(pdfPath)) {
    console.error('Sample PDF not found at:', pdfPath);
    process.exit(1);
}

const dataBuffer = fs.readFileSync(pdfPath);

pdf(dataBuffer).then(function (data) {
    console.log('Number of pages:', data.numpages);
    console.log('Info:', data.info);
    console.log('Text content length:', data.text.length);
    console.log('First 100 chars:', data.text.substring(0, 100));
}).catch(function (error) {
    console.error('Error parsing PDF:', error);
});
