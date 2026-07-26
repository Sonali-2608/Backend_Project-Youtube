import {v2 as cloudinary} from "cloudinary"
import fs from "fs"


cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null
        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        // file has been uploaded successfull
        //console.log("file is uploaded on cloudinary ", response.url);
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath)
        }
        return response;

    } catch (error) {
        if (localFilePath && fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operation got failed
        }
        return null;
    }
}

const deleteFromCloudinary = async (fileUrl, resourceType = "image") => {
    try {
        if (!fileUrl) return null

        const url = new URL(fileUrl)
        const uploadIndex = url.pathname.indexOf("/upload/")

        if (uploadIndex === -1) return null

        const publicIdWithVersion = url.pathname
            .slice(uploadIndex + "/upload/".length)
            .replace(/^v\d+\//, "")
            .replace(/\.[^/.]+$/, "")

        if (!publicIdWithVersion) return null

        return await cloudinary.uploader.destroy(publicIdWithVersion, {
            resource_type: resourceType
        })
    } catch (error) {
        return null
    }
}

export {uploadOnCloudinary, deleteFromCloudinary}
