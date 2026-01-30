// Native fetch is available in Node.js 18+

// Native fetch is available in Node.js 18+
// If running in environment without native fetch (e.g. older node), uncomment above line.
// For this environment (mac/node 20+), native fetch is available.

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function runTests() {
    console.log(`Running API tests against ${BASE_URL}...`);
    let passed = 0;
    let failed = 0;

    const test = async (name, fn) => {
        try {
            process.stdout.write(`Testing ${name}... `);
            await fn();
            console.log('✅ PASSED');
            passed++;
        } catch (error) {
            console.log('❌ FAILED');
            console.error('  Error:', error.message);
            if (error.response) {
                console.error('  Response status:', error.response.status);
                try {
                    const text = await error.response.text();
                    console.error('  Response body:', text);
                } catch (e) { }
            }
            failed++;
        }
    };

    const assert = (condition, message) => {
        if (!condition) {
            throw new Error(message || 'Assertion failed');
        }
    };

    const request = async (path, options = {}) => {
        const url = `${BASE_URL}${path}`;
        const response = await fetch(url, options);
        if (!response.ok) {
            const error = new Error(`Request failed with status ${response.status}`);
            error.response = response;
            throw error;
        }
        return response;
    };

    // 1. Initialize DB
    await test('GET /api/init', async () => {
        const res = await request('/api/init');
        const data = await res.json();
        assert(data.status === 'success' || data.message === 'Database initialized successfully', 'Failed to initialize DB');
    });

    // 2. Seed Data
    await test('GET /api/seed', async () => {
        const res = await request('/api/seed');
        const data = await res.json();
        assert(data.message.includes('successfully'), 'Failed to seed data');
    });

    // 3. Get User Config
    await test('GET /api/user-configuration', async () => {
        const res = await request('/api/user-configuration');
        const data = await res.json();
        assert(data.currency === 'USD', 'Default currency should be USD');
    });

    // 4. Update User Config
    await test('PUT /api/user-configuration', async () => {
        const newConfig = { currency: 'EUR', showCurrencySymbol: false };
        const res = await request('/api/user-configuration', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newConfig),
        });
        const data = await res.json();
        assert(data.currency === 'EUR', 'Currency should be updated to EUR');

        // Verify update
        const verifyRes = await request('/api/user-configuration');
        const verifyData = await verifyRes.json();
        assert(verifyData.currency === 'EUR', 'Verified currency should be EUR');
    });

    // 5. Create Subscription
    let createdSubId;
    await test('POST /api/subscriptions', async () => {
        const newSub = {
            name: 'Test Netflix',
            amount: 15.99,
            dueDate: '2023-12-25',
            icon: 'netflix',
            color: '#E50914',
            account: 'Credit Card',
            autopay: true,
            intervalValue: 1,
            intervalUnit: 'months',
            notify: true,
            currency: 'USD',
            tags: ['entertainment']
        };

        const res = await request('/api/subscriptions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newSub),
        });
        const data = await res.json();
        assert(data.name === 'Test Netflix', 'Name mismatch');
        assert(data.id, 'Should have an ID');
        createdSubId = data.id;
    });

    // 6. Get Subscription by ID
    await test('GET /api/subscriptions/[id]', async () => {
        assert(createdSubId, 'No created subscription ID');
        const res = await request(`/api/subscriptions/${createdSubId}`);
        const data = await res.json();
        assert(data.id === createdSubId, 'ID mismatch');
        assert(data.name === 'Test Netflix', 'Name mismatch');
    });

    // 7. Update Subscription
    await test('PUT /api/subscriptions/[id]', async () => {
        assert(createdSubId, 'No created subscription ID');
        const updateData = {
            name: 'Updated Netflix',
            amount: 19.99,
            dueDate: '2023-12-25',
            intervalValue: 1,
            intervalUnit: 'months',
            currency: 'USD'
        };

        const res = await request(`/api/subscriptions/${createdSubId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData),
        });
        const data = await res.json();
        assert(data.name === 'Updated Netflix', 'Name should be updated');
        assert(data.amount === 19.99, 'Amount should be updated');
    });

    // 8. Get All Subscriptions
    await test('GET /api/subscriptions', async () => {
        const res = await request('/api/subscriptions');
        const data = await res.json();
        assert(Array.isArray(data), 'Should return an array');
        const found = data.find(sub => sub.id === createdSubId);
        assert(found, 'Created subscription should be in the list');
        assert(found.name === 'Updated Netflix', 'List item should be updated');
    });

    // 9. Delete Subscription
    await test('DELETE /api/subscriptions/[id]', async () => {
        assert(createdSubId, 'No created subscription ID');
        await request(`/api/subscriptions/${createdSubId}`, {
            method: 'DELETE',
        });

        // Verify deletion
        try {
            await request(`/api/subscriptions/${createdSubId}`);
            throw new Error('Should have failed to fetch deleted subscription');
        } catch (e) {
            assert(e.message.includes('404') || e.message.includes('500'), 'Should return 404 or error for deleted item');
        }
    });

    // 10. NTFY Settings
    await test('GET /api/ntfy-settings', async () => {
        const res = await request('/api/ntfy-settings');
        const data = await res.json();
        assert(data.domain, 'Should have a domain');
    });

    // 11. Update NTFY Settings
    await test('PUT /api/ntfy-settings', async () => {
        const newSettings = { topic: 'test-topic', domain: 'https://ntfy.sh' };
        const res = await request('/api/ntfy-settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newSettings),
        });
        const data = await res.json();
        assert(data.topic === 'test-topic', 'Topic should be updated');
    });

    console.log('\n---------------------------------------------------');
    console.log(`Tests Completed: ${passed} Passed, ${failed} Failed`);
    console.log('---------------------------------------------------');

    if (failed > 0) {
        process.exit(1);
    }
}

runTests().catch(err => {
    console.error('Fatal Error:', err);
    process.exit(1);
});
