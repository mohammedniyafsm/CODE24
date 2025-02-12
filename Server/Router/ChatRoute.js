const express = require("express");
const router = express.Router();
const OpenAI = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

router.post("/", async (req, res) => {
    try {
        const { message, courseContext } = req.body;

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: `You are a helpful course assistant for the course "${courseContext.title}". 
                             Course description: ${courseContext.description}
                             Provide helpful, concise responses related to the course content.`
                },
                { role: "user", content: message }
            ],
            max_tokens: 150,
            temperature: 0.7,
        });

        res.json({
            success: true,
            reply: completion.choices[0].message.content
        });

    } catch (error) {
        console.error("Error in chat route:", error);
        res.status(500).json({
            success: false,
            message: "Error processing chat request"
        });
    }
});

module.exports = router; 