/**
 * Calls the internal API to analyze an image using Gemini
 * @param {string} base64Image - The compressed base64 image string
 * @returns {Promise<Object>} - The structured analysis result
 */
export async function analyzeImage(base64Image) {
    try {
        const response = await fetch('/api/analyze-image', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ image: base64Image }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to analyze image');
        }

        return await response.json();
    } catch (error) {
        console.error("Gemini service error:", error);
        throw error;
    }
}

/**
 * API call with retry logic for better resilience
 */
export async function analyzeImageWithRetry(base64Image, maxRetries = 2) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await analyzeImage(base64Image);
        } catch (error) {
            if (attempt === maxRetries) throw error;
            const delay = 2000 * (attempt + 1);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}
