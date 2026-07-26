import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query

    if (userId && !isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user id")
    }

    const match = {
        isPublished: true
    }

    if (query?.trim()) {
        match.$or = [
            {title: {$regex: query.trim(), $options: "i"}},
            {description: {$regex: query.trim(), $options: "i"}}
        ]
    }

    if (userId) {
        match.owner = new mongoose.Types.ObjectId(userId)
    }

    const sort = {
        [sortBy || "createdAt"]: sortType === "asc" ? 1 : -1
    }

    const videos = await Video.aggregatePaginate(
        Video.aggregate([
            {$match: match},
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "owner",
                    pipeline: [
                        {
                            $project: {
                                username: 1,
                                fullName: 1,
                                avatar: 1
                            }
                        }
                    ]
                }
            },
            {
                $addFields: {
                    owner: {$first: "$owner"}
                }
            },
            {$sort: sort}
        ]),
        {
            page: Number(page),
            limit: Number(limit)
        }
    )

    return res
        .status(200)
        .json(new ApiResponse(200, videos, "Videos fetched successfully"))
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body

    if (!title?.trim() || !description?.trim()) {
        throw new ApiError(400, "Title and description are required")
    }

    const videoLocalPath = req.files?.videoFile?.[0]?.path
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path

    if (!videoLocalPath) {
        throw new ApiError(400, "Video file is required")
    }

    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail is required")
    }

    const videoFile = await uploadOnCloudinary(videoLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if (!videoFile?.url) {
        throw new ApiError(500, "Error while uploading video")
    }

    if (!thumbnail?.url) {
        throw new ApiError(500, "Error while uploading thumbnail")
    }

    const video = await Video.create({
        title: title.trim(),
        description: description.trim(),
        videoFile: videoFile.url,
        thumbnail: thumbnail.url,
        duration: videoFile.duration || 0,
        owner: req.user?._id
    })

    return res
        .status(201)
        .json(new ApiResponse(201, video, "Video published successfully"))
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id")
    }

    const video = await Video.findByIdAndUpdate(
        videoId,
        {$inc: {views: 1}},
        {new: true}
    ).populate("owner", "username fullName avatar")

    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    await User.findByIdAndUpdate(req.user?._id, {
        $addToSet: {
            watchHistory: videoId
        }
    })

    return res
        .status(200)
        .json(new ApiResponse(200, video, "Video fetched successfully"))
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const {title, description} = req.body

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id")
    }

    if (!title?.trim() || !description?.trim()) {
        throw new ApiError(400, "Title and description are required")
    }

    const updateFields = {
        title: title.trim(),
        description: description.trim()
    }

    if (req.file?.path) {
        const thumbnail = await uploadOnCloudinary(req.file.path)

        if (!thumbnail?.url) {
            throw new ApiError(500, "Error while uploading thumbnail")
        }

        updateFields.thumbnail = thumbnail.url
    }

    const video = await Video.findOneAndUpdate(
        {
            _id: videoId,
            owner: req.user?._id
        },
        {
            $set: updateFields
        },
        {
            new: true,
            runValidators: true
        }
    )

    if (!video) {
        throw new ApiError(404, "Video not found or unauthorized")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, video, "Video updated successfully"))

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id")
    }

    const video = await Video.findOneAndDelete({
        _id: videoId,
        owner: req.user?._id
    })

    if (!video) {
        throw new ApiError(404, "Video not found or unauthorized")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Video deleted successfully"))
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id")
    }

    const video = await Video.findOne({
        _id: videoId,
        owner: req.user?._id
    })

    if (!video) {
        throw new ApiError(404, "Video not found or unauthorized")
    }

    video.isPublished = !video.isPublished
    await video.save({validateBeforeSave: false})

    return res
        .status(200)
        .json(new ApiResponse(200, video, "Publish status toggled successfully"))
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
