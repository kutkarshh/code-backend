import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;
        // Uploading File on Cloudinary
        const result = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        // On File Successfully got uploaded on the cloudinary server
        console.log("File Uploaded Successfully on Cloudinary", result.url);
        return result;
    } catch (error) {
        FileSystem.unlinkSync(localFilePath);
        // Removes the temperory file stored on the local file system
        // as the Upload operation failed
    }
}

export { uploadOnCloudinary };
