require('dotenv').config();
const fs = require('fs');

async function testHF() {
    console.log("Testing HF API...");
    try {
        const hfModelId = process.env.HF_MODEL_ID ? process.env.HF_MODEL_ID.trim() : 'dima806/face_liveness_detection';
        const apiKey = process.env.HF_API_KEY ? process.env.HF_API_KEY.trim() : '';

        // create a dummy image buffer (just checking if api is reachable and auth works)
        const imageBuffer = Buffer.from('dummy image data');

        console.log("Model:", hfModelId);
        console.log("Key:", apiKey.substring(0, 10) + "...");

        const url = `https://router.huggingface.co/hf-inference/models/${hfModelId}`;
        console.log("URL:", url);

        const apiResponse = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/octet-stream'
            },
            body: imageBuffer
        });

        console.log("Status:", apiResponse.status, apiResponse.statusText);
        if (!apiResponse.ok) {
            const errorText = await apiResponse.text();
            console.error("Failed Response Text:", errorText.substring(0, 200) + "...");
            return;
        }

        const result = await apiResponse.json();
        console.log("Success:", result);
    } catch (e) {
        console.error("Exception:", e);
    }
}

testHF();
