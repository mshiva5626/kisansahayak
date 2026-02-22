const analyzeSoilImage = async (imageBase64, farmContext) => {
    const apiKey = "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";

    const prompt = `You are an expert agriculture AI. Analyze this soil image and consider the local farm data: State: ${farmContext?.state || 'Unknown'}, District: ${farmContext?.district || 'Unknown'}, Crop: ${farmContext?.crop_type || 'Unknown'}, Land type: ${farmContext?.land_type || 'Plain'}.
Determine the visual color and texture of this soil. Provide smart recommendations for fertilizer or soil amendments.
Return ONLY a valid JSON object with no markdown formatting. No code fences. No extra text.
The JSON must have exactly these keys:
{
  "status": "Optimal or Fair or Poor",
  "badge": "GOOD or OK or BAD",
  "message": "A short summary about the soil health in max 2 sentences.",
  "color": "e.g. Dark Brown",
  "colorHex": "#hexcode representing the color",
  "texture": "e.g. Loamy",
  "recommendationHtml": "Based on <span class='text-[#f97316] font-bold'>Low Nitrogen</span> and <strong class='text-slate-900 dark:text-white'>Healthy pH</strong>, we recommend applying <strong class='text-slate-900 dark:text-white'>50kg of Urea per acre</strong> before sowing."
}`;

    try {
        console.log("Calling OpenRouter Vision Model via fetch...");

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:5000",
                "X-Title": "Kisan Sahayak Soil Test"
            },
            body: JSON.stringify({
                model: "nvidia/nemotron-nano-12b-v2-vl:free",
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: prompt },
                            { type: "image_url", image_url: { url: imageBase64 } }
                        ]
                    }
                ]
            })
        });

        const result = await response.json();

        console.log("OpenRouter Response Status:", response.status);
        console.log("OpenRouter Response Body:", JSON.stringify(result).substring(0, 500));

        if (!response.ok) {
            console.error("OpenRouter API Error:", result);
            throw new Error(result.error?.message || `API returned status ${response.status}`);
        }

        if (!result.choices || result.choices.length === 0) {
            throw new Error("No choices returned from OpenRouter API.");
        }

        const responseText = result.choices[0].message.content;
        console.log("Raw VLM Response Text:", responseText);

        // Clean and parse JSON
        let cleaned = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();

        // Try to extract JSON from the response if there's surrounding text
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            cleaned = jsonMatch[0];
        }

        let parsed;
        try {
            parsed = JSON.parse(cleaned);
        } catch (parseError) {
            console.warn("Failed to parse VLM JSON response, using fallback. Raw:", cleaned.substring(0, 200));
            parsed = {
                status: 'Analysis Complete',
                badge: 'OK',
                message: 'Soil image was analyzed. For precise results, consider a physical soil test at your nearest lab.',
                color: 'Brown',
                colorHex: '#8B4513',
                texture: 'Mixed',
                recommendationHtml: 'Based on visual analysis, consider applying <strong class="text-slate-900 dark:text-white">balanced NPK fertilizer</strong> and <span class="text-[#f97316] font-bold">organic compost</span> to improve overall soil health.'
            };
        }

        // Add test date
        const options = { month: 'short', day: 'numeric', year: 'numeric' };
        parsed.date = new Date().toLocaleDateString('en-US', options);

        return parsed;

    } catch (error) {
        console.error("Soil AI Service Error:", error.message);

        // Return a graceful fallback instead of throwing
        return {
            status: 'Analysis Unavailable',
            badge: 'OK',
            message: 'AI analysis is temporarily unavailable. Please try again in a moment or consult your local agriculture office.',
            color: 'Unknown',
            colorHex: '#A0522D',
            texture: 'Unknown',
            recommendationHtml: 'We could not complete the AI analysis at this time. Please try uploading the image again, or visit your nearest <strong class="text-slate-900 dark:text-white">Krishi Vigyan Kendra</strong> for a physical soil test.',
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        };
    }
};

module.exports = { analyzeSoilImage };
