// Test script for absence and cover finder functionality

async function testWorkflow() {
    console.log('\n' + '='.repeat(60));
    console.log('TESTING ABSENCE & COVER FINDER WORKFLOW');
    console.log('='.repeat(60));

    try {
        // Step 1: Create an absence
        console.log('\nStep 1: Creating absence for a teacher...');
        const createResponse = await fetch('http://localhost:3000/api/absence/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                teacherNames: ['10-PHYSICS'], // Using actual teacher name from database
                date: '2026-01-13', // Monday
                reason: 'Sick leave'
            })
        });

        const createData = await createResponse.json();
        console.log('Create Response:', JSON.stringify(createData, null, 2));

        if (!createResponse.ok || !createData.absences || createData.absences.length === 0) {
            throw new Error('Failed to create absence');
        }

        const absenceId = createData.absences[0].id;
        console.log(`\n✓ Absence created with ID: ${absenceId}`);

        // Step 2: Find available teachers
        console.log('\nStep 2: Finding available cover teachers...');
        const availableResponse = await fetch(`http://localhost:3000/api/absence/${absenceId}/available-teachers`);
        const availableData = await availableResponse.json();

        if (!availableResponse.ok) {
            throw new Error('Failed to get available teachers');
        }

        console.log('\n' + '='.repeat(60));
        console.log('COVER FINDER RESULTS');
        console.log('='.repeat(60));
        console.log(`Absent Teacher: ${availableData.absentTeacher}`);
        console.log(`Date: ${availableData.date} (${availableData.dayOfWeek})`);
        console.log(`\nSchedule Slots Needing Cover: ${availableData.slots.length}`);

        // Show each slot with available teachers
        availableData.slots.forEach((slot, index) => {
            console.log(`\n${index + 1}. ${slot.time}`);
            console.log(`   Subject: ${slot.subject}`);
            console.log(`   Class: ${slot.classRoom || 'N/A'}`);
            console.log(`   Available Teachers (${slot.availableTeachers.length}):`);

            if (slot.availableTeachers.length === 0) {
                console.log('      ⚠️  No teachers available for this slot!');
            } else {
                slot.availableTeachers.slice(0, 5).forEach(teacher => {
                    console.log(`      - ${teacher.name}`);
                });
                if (slot.availableTeachers.length > 5) {
                    console.log(`      ... and ${slot.availableTeachers.length - 5} more`);
                }
            }
        });

        console.log('\n' + '='.repeat(60));
        console.log('✓ TEST COMPLETED SUCCESSFULLY!');
        console.log('='.repeat(60));

    } catch (error) {
        console.error('\n❌ TEST FAILED:', error);
        process.exit(1);
    }
}

testWorkflow();
