// @ts-ignore - pdfjs-dist types may not be fully compatible
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.min.mjs';

// Set up the worker source
// For Node.js without a browser environment, we might not strictly need the worker if we use `legacy` build or similar,
// but usually it's good practice. 
// However, in server-side Next.js, we just need to make sure we can load the library.
// We are using the 'legacy' build to maximize compatibility if needed, or just standard.
// Let's try standard import first.

// Configuring the worker is strictly for browser usage mostly. 
// In Node, we often can just use it. 
// But sometimes:
// pdfjs.GlobalWorkerOptions.workerSrc = ...

// Actually for Node.js usage with pdfjs-dist v4+, we often need to be careful with imports.
// This file centralizes the import.

export { pdfjs };
