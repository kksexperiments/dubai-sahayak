/**
 * Fetches audio for the given text and plays it
 * @param {string} text - The text to convert to speech
 * @returns {Promise<HTMLAudioElement>} - The audio object
 */
export async function playTextToSpeech(text) {
    try {
        const response = await fetch('/api/text-to-speech', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text }),
        });

        if (!response.ok) {
            throw new Error('Failed to generate speech');
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);

        return new Promise((resolve, reject) => {
            audio.onended = () => {
                URL.revokeObjectURL(url);
                resolve();
            };
            audio.onerror = (err) => reject(err);
            audio.play();
        });
    } catch (error) {
        console.error("TTS service error:", error);
        throw error;
    }
}
