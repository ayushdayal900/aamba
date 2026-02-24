const fs = require('fs');

async function testSubmitKyc() {
    console.log("Testing POST /api/users/kyc");

    try {
        const loginRes = await fetch('http://localhost:5000/api/users/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'final_test_user_7@example.com',
                password: 'password123'
            })
        });

        const loginData = await loginRes.json();
        const token = loginData.data.token;
        console.log("Got token:", token.substring(0, 20) + '...');

        // Use a tiny 1x1 transparent PNG base64
        const imageStr = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

        const res = await fetch('http://localhost:5000/api/users/kyc', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                documentType: 'Aadhaar',
                documentNumber: '111122223333',
                image: imageStr
            })
        });

        if (!res.ok) {
            console.log("KYC Error Valid:", res.status, await res.text());
        } else {
            console.log("Success KYC Valid!", JSON.stringify(await res.json(), null, 2));
        }

    } catch (e) {
        console.error("Test failed:", e.message);
    }
}

testSubmitKyc();
