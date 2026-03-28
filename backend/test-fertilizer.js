async function test() {
    try {
        console.log("Attempting to POST to Fertilizer Marketplace API...");
        const response = await fetch('http://localhost:5000/api/fertilizer/ask', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                messages: [{ role: 'user', content: 'What is the price of Urea?' }]
            })
        });
        
        console.log('STATUS:', response.status);
        const data = await response.json();
        console.log('RESPONSE:', JSON.stringify(data, null, 2));
    } catch(err) {
        console.error('FETCH ERROR:', err);
    }
}
test();
