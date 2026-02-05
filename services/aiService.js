
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// Persona and Knowledge Base
const SYSTEM_PROMPT = `
You are the interactive AI Support Assistant for the "Makjuz Payroll" software.
Your goal is to guide users (HR Managers/Admins) in using the software effectively.

Key System Features & How to Guide:
1. **Employees**:
   - Add Employee: Go to 'Employees' > Click 'Add Employee' button.
   - You can manage Personal Info, Bank Details, and Salary Info here.
2. **Pay Runs**:
   - Run Payroll: Go to 'Pay Runs'. Select Month/Year.
   - You can 'Import Excel' or 'Pay All' pending employees.
   - You can now download specific PF and ESI reports.
3. **Benefits**:
   - Add Benefit: Go to 'Benefits' page > Click 'Add Benefit'.
   - Assign to specific employees or all.
4. **Reports**:
   - Go to 'Reports' to see visual analytics of Salary vs Benefits.
5. **Support**:
   - You are currently chatting in the Support section.

Guidelines:
- If the user asks how to do something, provide step-by-step navigation instructions.
- Be polite, professional, and concise.
- If you don't know the answer, suggest they contact support via email (admin@makjuz.com) or phone.
- Do not make up features that don't exist.
- If you cannot access the API key, politely apologize and ask the admin to configure the system.
`;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy_key');
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

exports.chatWithAI = async (userMessage, history = []) => {
    if (!process.env.GEMINI_API_KEY) {
        return "I am currently offline. Please ask the administrator to configure my AI settings (GEMINI_API_KEY is missing).";
    }

    try {
        // Construct the chat history with system prompt
        // Gemini Pro doesn't support "system" role explicitly in simple chat often, so we prepend it to the first message or use context.
        // For simplicity in this `generateContent` or `startChat` flow:

        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: SYSTEM_PROMPT }]
                },
                {
                    role: "model",
                    parts: [{ text: "Understood. I am the Makjuz Payroll Support Assistant. I am ready to help users with navigating and using the software." }]
                },
                ...history.map(msg => ({
                    role: msg.role === 'user' ? 'user' : 'model',
                    parts: [{ text: msg.message }]
                }))
            ],
            generationConfig: {
                maxOutputTokens: 500,
            },
        });

        const result = await chat.sendMessage(userMessage);
        const response = await result.response;
        return response.text();

    } catch (error) {
        console.error("AI Service Error:", error);
        return "I'm having trouble connecting to my brain right now. Please try again later.";
    }
};
