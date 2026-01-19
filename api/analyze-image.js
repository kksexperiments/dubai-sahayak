const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY);

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { image } = req.body;
        if (!image) {
            return res.status(400).json({ error: 'No image provided' });
        }

        // Check for API key presence
        if (!process.env.VITE_GEMINI_API_KEY) {
            console.error("CRITICAL: VITE_GEMINI_API_KEY is missing from environment variables.");
            return res.status(500).json({ error: "API Key চাৰ্ভাৰত পোৱা নগ'ল। অনুগ্ৰহ কৰি Vercel ত Key টো যোগ কৰক।" });
        }

        // Remove base64 prefix if exists
        const base64Data = image.replace(/^data:image\/\w+;base64,/, "");

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const systemPrompt = `
You are a helpful, senior travel guide for an Assamese-speaking traveler in Dubai.
The traveler has limited English proficiency and needs clear, reassurance, and detailed information.

Analyze this image and provide a comprehensive response in simple, everyday Assamese.

Your response MUST follow this structure with exact headers:

**চিনাক্তকৰণ (Identification):**
Identify the object or place. Is it a landmark, a product, a sign, or a restaurant menu?

**অনুবাদ (Translation):**
Translate any visible English or Arabic text into simple Assamese. 
Format: "Original Text" = অনুবাদ

**ব্যাখ্যা আৰু ইতিহাস (Explanation & History):**
Provide a deep dive. What is this place or thing? What is the history behind it? 
Why is it significant in Dubai? Explain what it means for the traveler (e.g., if it's a food item, explain what's in it; if it's a landmark, share a fun historical fact). - 3-5 sentences

**পৰৱৰ্তী পদক্ষেপ (Next Steps):**
Actionable advice. What should the traveler do now? (Go inside, wait for a signal, buy a ticket, or simply enjoy the view).
Use numbered steps (১. ২. ৩.).

**উপযোগী পৰামৰ্শ (Helpful Tip):**
One elite travel tip related to this context to make their trip easier.

LANGUAGE GUIDELINES:
- Use warm, respectful, and informal Assamese (Elder-friendly).
- Explain technical or English terms in parenthesis.
- If the photo is too blurry to identify, politely ask for another photo.
`;

        const result = await model.generateContent([
            systemPrompt,
            {
                inlineData: {
                    data: base64Data,
                    mimeType: "image/jpeg"
                }
            }
        ]);

        const responseText = result.response.text();
        console.log("Gemini Response received.");

        // Parse the response into structured sections
        const sections = {
            identification: extractSection(responseText, "চিনাক্তকৰণ"),
            translation: extractSection(responseText, "অনুবাদ"),
            explanation: extractSection(responseText, "ব্যাখ্যা আৰু ইতিহাস"),
            nextSteps: extractSection(responseText, "পৰৱৰ্তী পদক্ষেপ")
                ?.split('\n')
                .filter(line => line.trim())
                .map(line => line.trim()),
            tip: extractSection(responseText, "উপযোগী পৰামৰ্শ"),
            raw: responseText
        };

        return res.status(200).json(sections);

    } catch (error) {
        console.error("Gemini API Error details:", error.message);
        return res.status(500).json({
            error: "বিশ্লেষণ কৰোঁতে সমস্যা হৈছে।",
            details: error.message
        });
    }
};

function extractSection(text, header) {
    const regex = new RegExp(`\\*\\*${header}\\s*\\(?.*?\\)?\\s*:\\*\\*([\\s\\S]*?)(?=\\*\\*|$)`, 'i');
    const match = text.match(regex);
    return match ? match[1].trim() : null;
}
