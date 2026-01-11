const { jsPDF } = require("jspdf");
const pdf = require('pdf-parse');

async function testGeneration() {
    console.log("Testing PDF generation and parsing compatibility...");

    // Test 1: ArrayBuffer (Current approach)
    try {
        const doc = new jsPDF({ compress: false });
        doc.text("Hello World", 10, 10);
        const buffer = Buffer.from(doc.output('arraybuffer'));
        console.log("Test 1 (ArrayBuffer) Size:", buffer.length);
        await pdf(buffer);
        console.log("Test 1: SUCCESS");
    } catch (e) {
        console.log("Test 1: FAILED", e.message);
    }

    // Test 2: String -> Buffer
    try {
        const doc = new jsPDF({ compress: false });
        doc.text("Hello World", 10, 10);
        // output() returns string by default or we can ask for valid string
        const str = doc.output();
        const buffer = Buffer.from(str, 'binary');
        console.log("Test 2 (String -> Binary Buffer) Size:", buffer.length);
        await pdf(buffer);
        console.log("Test 2: SUCCESS");
    } catch (e) {
        console.log("Test 2: FAILED", e.message);
    }

    // Test 3: Compressed
    try {
        const doc = new jsPDF({ compress: true });
        doc.text("Hello World", 10, 10);
        const buffer = Buffer.from(doc.output('arraybuffer'));
        console.log("Test 3 (Compressed ArrayBuffer) Size:", buffer.length);
        await pdf(buffer);
        console.log("Test 3: SUCCESS");
    } catch (e) {
        console.log("Test 3: FAILED", e.message);
    }
}

testGeneration();
