const cloudinary = require('cloudinary').v2
const ApiError = require("./ApiError");

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});

const uploadToCloudinary = (fileBuffer, folder) => {
    return new Promise((resolve, reject) => {
        
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: folder,
                resource_type: "auto",
            },
            (error, result) => {
                if (error) {
                    console.error("Cloudinary Upload Error:", error);
                    
                    return reject(new ApiError(500, "Cloudinary upload failed."));
                }
                
                resolve({ url: result.secure_url, public_id: result.public_id });
            }
        );

        uploadStream.end(fileBuffer);
    });
};

const deleteFromCloudinary = (publicId) => {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.destroy(publicId, (error, result) => {
            if (error) {
                console.error("Cloudinary Delete Error:", error);
                return reject(new ApiError(500, "Cloudinary deletion failed."));
            }
            resolve(result);
        });
    });
};

const extractPublicIdFromUrl = (imageUrl) => {
    try {
        if (!imageUrl) return null;
        const parts = imageUrl.split('/');
        const uploadIndex = parts.findIndex(part => part === 'upload');
        if (uploadIndex === -1) return null;
        let startIndex = uploadIndex + 1;
        if (parts[startIndex].match(/^v\d+$/)) startIndex++;
        const publicIdWithExt = parts.slice(startIndex).join('/');
        return publicIdWithExt.substring(0, publicIdWithExt.lastIndexOf('.'));
    } catch (error) {
        console.error(' Error extracting publicId:', error);
        return null;
    }
};

module.exports = {
    uploadToCloudinary,
    deleteFromCloudinary,
    extractPublicIdFromUrl,
};