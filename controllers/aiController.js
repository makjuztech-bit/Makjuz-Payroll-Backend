const aiService = require('../services/aiService');

exports.handleChat = async (req, res) => {
    try {
        const { message, history } = req.body;

        if (!message) {
            return res.status(400).json({ message: 'Message is required' });
        }

        const response = await aiService.chatWithAI(message, history || []);

        res.json({
            reply: response,
            timestamp: new Date()
        });

    } catch (error) {
        console.error('Chat controller error:', error);
        res.status(500).json({ message: 'Internal server error processing chat' });
    }
};
