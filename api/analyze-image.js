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

        // Remove base64 prefix if exists
        const base64Data = image.replace(/^data:image\/\w+;base64,/, "");

        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

        const systemPrompt = `
You are a helpful travel guide for an Assamese-speaking traveler in Dubai who has limited English proficiency.

Analyze this image and provide a response in Assamese language ONLY.

Your response must include these sections with exact headers:

**চিনাক্তকৰণ (Identification):**
What is visible in this image? (sign, place, menu, ticket machine, etc.) - 1-2 sentences

**অনুবাদ (Translation):**
If there is any English/Arabic text visible, translate it accurately to Assamese.
For each text element, format as: "English text" = অসমীয়া অনুবাদ

**ব্যাখ্যা (Explanation):**
Provide context - what is this place/thing? Why is it important for a traveler? 
What cultural or practical information should they know? - 2-3 sentences

**পৰৱৰ্তী পদক্ষেপ (Next Steps):**
Tell the traveler EXACTLY what they should do next. Be specific and actionable.
Use numbered steps (১. ২. ৩.) for clarity.
Example: "১. Visitors শাৰীত থিয় দিয়ক ২. পাছপৰ্ট হাতত ৰাখক"

**উপযোগী পৰামৰ্শ (Helpful Tip):**
Share one practical tip about this location or situation that would make their experience better.
Could be about timing, costs, cultural norms, or shortcuts. - 1-2 sentences

**LANGUAGE GUIDELINES:**
- Use simple, everyday Assamese (not literary/formal)
- Common Hindi loanwords are OK: "passport" (পাছপৰ্ট), "ticket" (টিকট), "metro" (মেট্ৰ')
- Avoid English words where good Assamese equivalents exist
- Be warm, encouraging, and reassuring in tone
- If image is unclear: "ফটোখন স্পষ্ট নহয়। অনুগ্ৰহ কৰি পুনৰ তোলক।"
- If no text visible: Still provide helpful guidance based on what you can see

**RESPONSE FORMAT:**
Always use the exact Assamese section headers shown above with ** bold markers.
Keep sections concise - this will be read on a mobile phone screen.
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

        // Parse the response into structured sections
        const sections = {
            identification: extractSection(responseText, "চিনাক্তকৰণ"),
            translation: extractSection(responseText, "অনুবাদ"),
            explanation: extractSection(responseText, "ব্যাখ্যা"),
            nextSteps: extractSection(responseText, "পৰৱৰ্তী পদক্ষেপ")
                ?.split('\n')
                .filter(line => line.trim())
                .map(line => line.trim()),
            tip: extractSection(responseText, "উপযোগী পৰামৰ্শ"),
            raw: responseText // Fallback
        };

        return res.status(200).json(sections);

    } catch (error) {
        console.error("Gemini API Error:", error);
        return res.status(500).json({ error: "API ত কিবা সমস্যা হৈছে। অনুগ্ৰহ কৰি আকৌ চেষ্টা কৰক।" });
    }
};

function extractSection(text, header) {
    const regex = new RegExp(`\\*\\*${header}\\s*\\(?.*?\\)?\\s*:\\*\\*([\\s\\S]*?)(?=\\*\\*|$)`, 'i');
    const match = text.match(regex);
    return match ? match[1].trim() : null;
}
