const express = require("express");
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini AI with proper configuration
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

router.post("/generate-assessment", async (req, res) => {
    try {
        const { topic, subtopic, numQuestions, difficulty } = req.body;

        // Create a more structured prompt
        const prompt = `Create ${numQuestions} ${difficulty} level multiple choice questions about ${topic}${subtopic ? ` focusing on ${subtopic}` : ''}.

        Requirements:
        1. Each question must have exactly 4 options (A, B, C, D)
        2. One option must be correct
        3. All options must be plausible
        4. Include the correct answer after each question

        Format each question exactly like this example:
        Q: What is JavaScript?
        A) A programming language
        B) A markup language
        C) A database
        D) An operating system
        Correct: A

        Please generate ${numQuestions} questions in exactly this format.`;

        // Generate content
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Parse questions more carefully
        const questionBlocks = text.split(/Q:/).filter(block => block.trim());
        const questions = questionBlocks.map(block => ({
            question: `Q:${block.trim()}`,
            type: 'multiple_choice'
        }));

        console.log('Generated questions:', questions); // For debugging

        res.json({
            status: 'success',
            assessment: {
                topic,
                subtopic,
                questions,
                totalQuestions: questions.length
            }
        });

    } catch (error) {
        console.error('Quiz generation error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to generate quiz questions',
            error: error.message
        });
    }
});

module.exports = router; 