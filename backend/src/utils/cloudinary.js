import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import fs from "fs"; // Import file system module

dotenv.config();

// Cloudinary Configuration
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_SECRET
});

const uploadOnCloudinary = async (localPath) => {
    try {
        if (!localPath) {
            throw new Error("Local path is missing");
        }

        const result = await cloudinary.uploader.upload(localPath, {
            resource_type: "auto",
        });

        // console.log("File uploaded successfully:", result.url);

        // Remove the local file after upload
        fs.unlink(localPath, (err) => {
            if (err) {
                console.error("Error deleting file:", err);
            } else {
                console.log("Local file deleted successfully");
            }
        });

        return result;
    } catch (error) {
        console.error("Cloudinary Upload Error:", error);
        return null;
    }
};

export { uploadOnCloudinary };
