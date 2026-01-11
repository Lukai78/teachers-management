// PDF parsing temporarily disabled for server-side compatibility
// import { pdfjs } from '@/lib/pdf-worker';

export interface ParsedScheduleSlot {
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    subject: string;
    classRoom: string;
}

export interface ParsedTeacherSchedule {
    teacherName: string;
    slots: ParsedScheduleSlot[];
}

export async function parseSchedulePdf(buffer: Buffer): Promise<ParsedTeacherSchedule[]> {
    // Convert Buffer to Uint8Array for pdfjs-dist
    const uint8Array = new Uint8Array(buffer);

    const loadingTask = pdfjs.getDocument({
        data: uint8Array,
        useSystemFonts: true,
    });

    const doc = await loadingTask.promise;
    let fullText = '';

    for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
            // @ts-ignore - items can have different shapes, but str is common in TextItem
            .map((item: any) => item.str)
            .join(' '); // Join with space to keep words together, or newline if we want lines. 
        // However, PDF text extraction often breaks lines arbitrarily.
        // Let's try joining with newline for our line-based parser.
        fullText += pageText + '\n';
    }

    // For our specific line-based parser logic, we might need to be careful about how we join items.
    // Let's try to reconstruct lines based on Y position if we want to be fancy, 
    // but for now let's stick to a simple extraction and see if we can adapt the parsing logic.
    // Simpler approach for now: Join items with ' ' and split by some delimiter or try to detect lines.
    // Actually, let's re-implement the extraction to group by lines properly using the transform map if available, 
    // or just rely on the order.

    // Re-doing extraction to be more line-friendly:
    fullText = '';
    for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const textContent = await page.getTextContent();

        // Simple heuristic: Join items with space, but add newline if Y position changes significantly?
        // Or just trust the order and add newlines sparingly?
        // pdf-parse usually gives a big string.
        // Let's just join with newlines for check.
        const strings = textContent.items.map((item: any) => item.str);
        fullText += strings.join(' ') + '\n';
    }

    // Since our mock PDF puts everything on separate lines visually, checking if standard extraction preserves that.
    // Often it doesn't. 
    // Let's look at the previous parser logic: it expected "Teacher: <Name>" on a line.

    // BETTER APPROACH for unstructured text:
    // Just pass the text to a cleaning function.

    const schedules: ParsedTeacherSchedule[] = [];
    let currentTeacher: ParsedTeacherSchedule | null = null;

    // We might need to adjust this splitting logic depending on how pdfjs extracts text.
    // It might mash "Monday" and "09:00" together.
    const lines = fullText.split(/\n+/).map(line => line.trim()).filter(line => line.length > 0);

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    // We need to be more flexible with the parsing because pdfjs might produce "Teacher: John Doe Monday ..."
    // Let's tokenize instead of strictly line-based if helpful.
    // But let's try to preserve the existing logic first by mocking the TextContent properly? No, let's adapt.

    // Setup for "Teacher:" detection
    // Depending on extraction, "Teacher:" and "John Doe" might be separate items.

    // Let's refine the text extraction to specific lines.
    // ... Actually, let's try a robust "entire text" regex approach if possible, or just iterate tokens.

    const tokens = fullText.split(/\s+/);

    for (let i = 0; i < tokens.length; i++) {
        if (tokens[i] === 'Teacher:' && tokens[i + 1]) {
            // Found a teacher
            if (currentTeacher) {
                schedules.push(currentTeacher);
            }
            // Assume format "Teacher: Name Surname"
            // We need to grab name until we hit a Day or something else.
            // This is tricky. Let's assume Name is 2 words for now or until a known keyword.
            let name = tokens[i + 1];
            if (tokens[i + 2] && !days.includes(tokens[i + 2]) && tokens[i + 2] !== 'Teacher:') {
                name += ' ' + tokens[i + 2];
                // Skip extra token
                i++;
            }
            i++; // Skip name token

            currentTeacher = {
                teacherName: name,
                slots: []
            };
            continue;
        }

        if (currentTeacher && days.includes(tokens[i])) {
            // Found a day, expect: Day Start End Subject Room...
            if (i + 4 < tokens.length) {
                const day = tokens[i];
                const start = tokens[i + 1];
                const end = tokens[i + 2];
                const subject = tokens[i + 3];
                // Room might be multiple tokens. Take until next Day or End of string or Teacher:
                let room = tokens[i + 4];
                let j = i + 5;
                while (j < tokens.length) {
                    const nextToken = tokens[j];
                    if (days.includes(nextToken) || nextToken === 'Teacher:') {
                        break;
                    }
                    room += ' ' + nextToken;
                    j++;
                }

                // Validate time format?
                if (start.includes(':') && end.includes(':')) {
                    currentTeacher.slots.push({
                        dayOfWeek: day,
                        startTime: start,
                        endTime: end,
                        subject: subject,
                        classRoom: room
                    });

                    // Advance to last processed token (j-1), so loop i++ takes us to j.
                    i = j - 1;
                }
            }
        }
    }

    if (currentTeacher) {
        schedules.push(currentTeacher);
    }

    return schedules;
}
