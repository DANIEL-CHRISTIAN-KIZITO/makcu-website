const pool = require('../config/db');

const events = [
    {
        title: 'Main Campus Fellowship Meeting',
        description: 'Weekly fellowship gathering where we worship, discuss God\'s word and pray together. Open to all Makerere students interested in Christian fellowship.',
        event_date: '2026-09-12',
        event_time: '14:00',
        location: 'Students\' Guild Hall, Makerere University Main Campus',
        image_path: '/uploads/event-default.jpg'
    },
    {
        title: 'Evening Prayers & Worship Night',
        description: 'A time of powerful worship, intercession and spiritual renewal. Join us as we seek God\'s face through worship, songs and corporate prayer.',
        event_date: '2026-09-15',
        event_time: '18:30',
        location: 'Main Campus Chapel',
        image_path: '/uploads/event-default.jpg'
    },
    {
        title: 'Campus Outreach & Community Service',
        description: 'Join us in reaching out to communities around Makerere. We will be sharing the gospel, offering prayer and conducting community service projects.',
        event_date: '2026-09-20',
        event_time: '10:00',
        location: 'Wandegeya Community, Kampala',
        image_path: '/uploads/event-default.jpg'
    }
];

(async () => {
    try {
        console.log('Seeding events...');
        for (const event of events) {
            const result = await pool.query(
                `INSERT INTO events (title, description, event_date, event_time, location, image_path, created_by)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)
                 RETURNING id`,
                [event.title, event.description, event.event_date, event.event_time, event.location, event.image_path, 1]
            );
            console.log(`✓ Added event: "${event.title}" (ID: ${result.rows[0].id})`);
        }
        console.log('✓ All events seeded successfully!');
        await pool.end();
    } catch (err) {
        console.error('Error seeding events:', err.message);
        await pool.end();
        process.exit(1);
    }
})();
