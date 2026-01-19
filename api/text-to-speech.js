const textToSpeech = require('@google-cloud/text-to-speech');

// Load credentials from environment variable
const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON || '{}');

const client = new textToSpeech.TextToSpeechClient({
    credentials,
});

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { text } = req.body;
        if (!text) {
            return res.status(400).json({ error: 'No text provided' });
        }

        const request = {
            input: { text },
            voice: {
                languageCode: 'hi-IN', // Using Hindi for better clarity as per PRD
                name: 'hi-IN-Neural2-A',
                ssmlGender: 'FEMALE',
            },
            audioConfig: {
                audioEncoding: 'MP3',
                speakingRate: 0.9, // Slightly slower for elderly users
            },
        };

        const [response] = await client.synthesizeSpeech(request);

        res.setHeader('Content-Type', 'audio/mpeg');
        return res.send(response.audioContent);

    } catch (error) {
        console.error("TTS API Error:", error);
        return res.status(500).json({ error: "Audio generate কৰোঁতে সমস্যা হৈছে।" });
    }
};
