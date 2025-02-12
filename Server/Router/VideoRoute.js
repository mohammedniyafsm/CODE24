const express = require("express");
const router = express.Router();
const { spawn } = require('child_process');
const path = require('path');

router.post("/summary", async (req, res) => {
    try {
        const { videoUrl } = req.body;
        if (!videoUrl) {
            return res.status(400).json({ success: false, message: "Video URL is required" });
        }

        // Call Python script
        const pythonProcess = spawn('python', [
            path.join(__dirname, '../utils/video_summarizer.py'),
            videoUrl
        ]);

        let summary = '';
        let error = '';

        pythonProcess.stdout.on('data', (data) => {
            summary += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            error += data.toString();
        });

        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                console.error("Python script error:", error);
                return res.status(500).json({ 
                    success: false, 
                    message: "Error generating summary" 
                });
            }
            res.json({ 
                success: true, 
                summary: summary.trim() 
            });
        });

    } catch (error) {
        console.error("Error in video summary route:", error);
        res.status(500).json({ 
            success: false, 
            message: "Server error while generating summary" 
        });
    }
});

module.exports = router; 