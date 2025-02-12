const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const path = require("path");

// Cloudinary Configuration with direct values
cloudinary.config({
    cloud_name: "dnkenioua",
    api_key: "674858438572951",
    api_secret: "zDq_8oKyI6kqs7xpM6F_Qli_T_A",
    secure: true
});

// Test the configuration
console.log('Cloudinary configured successfully');

const uploadVideo = async (filePath) => {
    try {
        const result = await cloudinary.uploader.upload(filePath, {
            resource_type: "video",
            folder: "course_videos",
            chunk_size: 6000000, // 6MB chunks
            eager: [
                { format: "mp4", transformation: [
                    {quality: "auto"},
                    {fetch_format: "mp4"}
                ]}
            ]
        });
        return result;
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        throw error;
    }
};

module.exports = {
    cloudinary,
    uploadVideo
};


