import * as XLSX from 'xlsx';

export interface ScheduleSlot {
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    subject: string;
    classRoom: string;
}

export interface TeacherSchedule {
    teacherName: string;
    slots: ScheduleSlot[];
}

/**
 * Parse class information from Excel cell value
 * Can handle multiple formats:
 * 1. "Subject\r\nGrade\r\nCampus" (from teacher schedules)
 * 2. "Subject\r\nMs./Mr. TeacherName" (from class schedules)
 */
function parseClassInfo(cellValue: string): { subject: string; grade: string; campus: string } | null {
    if (!cellValue || typeof cellValue !== 'string') {
        return null;
    }

    // Split by newlines (could be \r\n or \n)
    const parts = cellValue.split(/\r?\n/).map(p => p.trim()).filter(p => p);

    if (parts.length >= 3) {
        return {
            subject: parts[0],
            grade: parts[1],
            campus: parts[2]
        };
    } else if (parts.length === 2) {
        // Sometimes might be just Subject + Grade or Subject + Campus
        return {
            subject: parts[0],
            grade: parts[1] || '',
            campus: ''
        };
    } else if (parts.length === 1) {
        return {
            subject: parts[0],
            grade: '',
            campus: ''
        };
    }

    return null;
}

/**
 * Extract teacher name from a cell value in format "Subject\r\nMs./Mr. NAME"
 */
function extractTeacherFromCell(cellValue: string): string | null {
    if (!cellValue || typeof cellValue !== 'string') {
        return null;
    }

    const lines = cellValue.split(/\r?\n/).map(l => l.trim());
    for (const line of lines) {
        const match = line.match(/^\s*(Ms\.|Mr\.)\s*(.+)$/);
        if (match) {
            return `${match[1]} ${match[2].trim()}`;
        }
    }
    return null;
}

/**
 * Extract teacher name from the Instructor field in the sheet
 * Format: "Instructor: Ms./Mr. NAME (Tel: ...)"
 */
function extractTeacherName(worksheet: XLSX.WorkSheet): string | null {
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as string[][];

    // Look for "Instructor:" in the first several rows
    for (let i = 0; i < Math.min(10, data.length); i++) {
        const row = data[i];
        for (const cell of row) {
            if (typeof cell === 'string' && cell.includes('Instructor:')) {
                // Extract name from format: "Instructor: Ms. NAME (Tel: ...)"
                const match = cell.match(/Instructor:\s*(Ms\.|Mr\.)\s*([^(]+)/);
                if (match) {
                    const title = match[1];
                    const name = match[2].trim();
                    return `${title} ${name}`;
                }
            }
        }
    }

    return null;
}

/**
 * Parse a class schedule sheet (N, K1-K3, G1-G11)
 * Format: cells contain "Subject\r\nMs./Mr. TeacherName"
 */
function parseClassScheduleSheet(worksheet: XLSX.WorkSheet, sheetName: string): TeacherSchedule[] {
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as string[][];
    const teacherSchedules = new Map<string, ScheduleSlot[]>();

    // Find the header row
    let headerRowIndex = -1;
    let timeColumnIndex = -1;
    const dayColumns: { [day: string]: number } = {};

    for (let i = 0; i < data.length; i++) {
        const row = data[i];
        for (let j = 0; j < row.length; j++) {
            const cell = String(row[j]).toLowerCase();
            if (cell === 'time') timeColumnIndex = j;
            if (cell === 'monday') dayColumns['Monday'] = j;
            if (cell === 'tuesday') dayColumns['Tuesday'] = j;
            if (cell === 'wednesday') dayColumns['Wednesday'] = j;
            if (cell === 'thursday') dayColumns['Thursday'] = j;
            if (cell === 'friday') dayColumns['Friday'] = j;
        }

        if (timeColumnIndex !== -1 && Object.keys(dayColumns).length > 0) {
            headerRowIndex = i;
            break;
        }
    }

    if (headerRowIndex === -1) {
        return [];
    }

    // Extract grade/class from sheet name or first rows
    let classRoom = sheetName;
    for (let i = 0; i < Math.min(5, data.length); i++) {
        const row = data[i];
        for (const cell of row) {
            if (typeof cell === 'string' && cell.includes('Grade')) {
                const gradeMatch = cell.match(/Grade\s+([^\s/]+)/);
                if (gradeMatch) {
                    classRoom = gradeMatch[0].trim();
                    break;
                }
            }
        }
    }

    // Parse each time slot
    for (let i = headerRowIndex + 1; i < data.length; i++) {
        const row = data[i];
        const timeCell = String(row[timeColumnIndex] || '').trim();

        if (!timeCell || timeCell.toLowerCase().includes('lunch') || timeCell.toLowerCase().includes('break')) {
            continue;
        }

        const timeMatch = timeCell.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})\s*(AM|PM)?/i);
        if (!timeMatch) continue;

        const startTime = timeMatch[1];
        const endTime = timeMatch[2];
        const period = timeMatch[3] || '';

        // Parse each day column
        for (const [dayName, columnIndex] of Object.entries(dayColumns)) {
            const cellValue = String(row[columnIndex] || '').trim();
            if (!cellValue) continue;

            // Extract teacher name from cell
            const teacherName = extractTeacherFromCell(cellValue);
            if (!teacherName) continue;

            // Extract subject
            const lines = cellValue.split(/\r?\n/).map(l => l.trim()).filter(l => l);
            const subject = lines[0] || '';

            // Create or get teacher's schedule
            if (!teacherSchedules.has(teacherName)) {
                teacherSchedules.set(teacherName, []);
            }

            teacherSchedules.get(teacherName)!.push({
                dayOfWeek: dayName,
                startTime: `${startTime} ${period}`.trim(),
                endTime: `${endTime} ${period}`.trim(),
                subject,
                classRoom
            });
        }
    }

    return Array.from(teacherSchedules.entries()).map(
        ([teacherName, slots]) => ({ teacherName, slots })
    );
}

/**
 * Parse a single teacher's schedule sheet
 */
function parseSheet(worksheet: XLSX.WorkSheet, sheetName: string): TeacherSchedule | null {
    const slots: ScheduleSlot[] = [];

    // Extract teacher name from the sheet
    const teacherName = extractTeacherName(worksheet);
    if (!teacherName) {
        console.warn(`Could not find teacher name in sheet: ${sheetName}`);
        return null;
    }

    // Convert sheet to 2D array
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as string[][];

    if (data.length === 0) {
        return { teacherName, slots };
    }

    // Find the header row that contains day names
    let headerRowIndex = -1;
    let timeColumnIndex = -1;
    const dayColumns: { [day: string]: number } = {};

    for (let i = 0; i < data.length; i++) {
        const row = data[i];
        for (let j = 0; j < row.length; j++) {
            const cell = String(row[j]).toLowerCase();
            if (cell === 'time') {
                timeColumnIndex = j;
            }
            if (cell === 'monday') dayColumns['Monday'] = j;
            if (cell === 'tuesday') dayColumns['Tuesday'] = j;
            if (cell === 'wednesday') dayColumns['Wednesday'] = j;
            if (cell === 'thursday') dayColumns['Thursday'] = j;
            if (cell === 'friday') dayColumns['Friday'] = j;
        }

        if (timeColumnIndex !== -1 && Object.keys(dayColumns).length > 0) {
            headerRowIndex = i;
            break;
        }
    }

    if (headerRowIndex === -1 || timeColumnIndex === -1) {
        console.warn(`Could not find schedule header in sheet for: ${teacherName}`);
        return { teacherName, slots };
    }

    // Parse each time slot row
    for (let i = headerRowIndex + 1; i < data.length; i++) {
        const row = data[i];
        const timeCell = String(row[timeColumnIndex] || '').trim();

        // Skip if no time or if it's a break/lunch row
        if (!timeCell || timeCell.toLowerCase().includes('lunch') || timeCell.toLowerCase().includes('break')) {
            continue;
        }

        // Parse time range (e.g., "8:00 - 8:50 AM")
        const timeMatch = timeCell.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})\s*(AM|PM)?/i);
        if (!timeMatch) {
            continue;
        }

        const startTime = timeMatch[1];
        const endTime = timeMatch[2];
        const period = timeMatch[3] || '';

        // Parse each day column
        for (const [dayName, columnIndex] of Object.entries(dayColumns)) {
            const cellValue = String(row[columnIndex] || '').trim();

            if (!cellValue) {
                continue; // No class this slot
            }

            const classInfo = parseClassInfo(cellValue);
            if (classInfo && classInfo.subject) {
                // Combine grade and campus into classRoom field
                const classRoomParts = [classInfo.grade, classInfo.campus].filter(p => p);
                const classRoom = classRoomParts.length > 0 ? classRoomParts.join(' - ') : '';

                slots.push({
                    dayOfWeek: dayName,
                    startTime: `${startTime} ${period}`.trim(),
                    endTime: `${endTime} ${period}`.trim(),
                    subject: classInfo.subject,
                    classRoom
                });
            }
        }
    }

    return { teacherName, slots };
}

/**
 * Main function to parse Excel schedule file
 */
export async function parseScheduleExcel(buffer: Buffer): Promise<TeacherSchedule[]> {
    try {
        // Read the workbook
        const workbook = XLSX.read(buffer, { type: 'buffer' });

        // Group schedules by teacher name
        const schedulesByTeacher = new Map<string, ScheduleSlot[]>();

        // Parse each sheet
        for (const sheetName of workbook.SheetNames) {
            const worksheet = workbook.Sheets[sheetName];

            // Try teacher schedule format first (has "Instructor:" field)
            const teacherSchedule = parseSheet(worksheet, sheetName);
            if (teacherSchedule && teacherSchedule.teacherName) {
                const existing = schedulesByTeacher.get(teacherSchedule.teacherName) || [];
                schedulesByTeacher.set(teacherSchedule.teacherName, [...existing, ...teacherSchedule.slots]);
            } else {
                // Try class schedule format (teacher names in cells)
                const classSchedules = parseClassScheduleSheet(worksheet, sheetName);
                for (const schedule of classSchedules) {
                    const existing = schedulesByTeacher.get(schedule.teacherName) || [];
                    schedulesByTeacher.set(schedule.teacherName, [...existing, ...schedule.slots]);
                }
            }
        }

        // Convert to array of schedules
        const schedules: TeacherSchedule[] = Array.from(schedulesByTeacher.entries()).map(
            ([teacherName, slots]) => ({ teacherName, slots })
        );

        console.log(`Successfully parsed ${schedules.length} teachers from ${workbook.SheetNames.length} sheets`);
        schedules.forEach(s => {
            console.log(`  - ${s.teacherName}: ${s.slots.length} slots`);
        });

        return schedules;

    } catch (error) {
        console.error('Error parsing Excel file:', error);
        throw new Error(`Failed to parse Excel schedule: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
