import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const folderName = 'YTClone';

const uploadOnCloudinary = async (localFilePath, publicId) => {
    try {
        if (!localFilePath) return null;

        // Uploading File on Cloudinary
        // Set folder name in publicId
        const fullPublicId = `${folderName}/${publicId}`;

        const uploadResponse = await cloudinary.uploader.upload(localFilePath, {
            public_id: fullPublicId,  // Include folder name in public ID
            overwrite: true,          // Overwrite the file if it already exists
        });

        // Remove the file from local storage
        fs.unlinkSync(localFilePath);

        if (uploadResponse.name === "Error")
            console.log("Failed to Upload File on Cloudinary ", uploadResponse.message);
        // On File Successfully got uploaded on the cloudinary server
        console.log("File Uploaded Successfully on Cloudinary ", uploadResponse.url);
        return uploadResponse;
    } catch (error) {
        console.log({ status: 500, message: "Failed to Upload File on Cloudinary " + error.message });
        fs.unlinkSync(localFilePath); // Removes the temporary file stored on the local file system
    }
}

const deleteOnCloudinary = async (publicId) => {
    try {
        if (!publicId) return null;
        // Deleting File on Cloudinary
        const deleteResponse = await cloudinary.uploader.destroy(`${folderName}/${publicId.split(".")[0]}`);

        // On File Successfully got deleted from the cloudinary server
        if (deleteResponse.result === "ok")
            console.log("File Deleted Successfully from Cloudinary");
        else
            console.log("Failed to Delete Cover Image from Cloudinary");

        return deleteResponse;
    } catch (error) {
        console.log({ status: 500, message: "Failed to Upload File on Cloudinary " + error.message });
    }
}

export { deleteOnCloudinary, uploadOnCloudinary };

