const express = require("express");
const cors = require("cors");
const ytdl = require("ytdl-core");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = "htrang245";

app.use(cors());
app.use(express.json());
app.use("/downloads", express.static("downloads"));

if (!fs.existsSync("downloads")) {
    fs.mkdirSync("downloads");
}

app.get("/", (req, res) => {
    res.send("🔥 API YOUTUBE MP4 + MP3 🔥");
});

app.get("/api/youtube/download", async (req, res) => {

    const { url, apikey } = req.query;

    if (apikey !== API_KEY) {
        return res.status(403).json({ status: false, message: "Sai API key" });
    }

    if (!url || !ytdl.validateURL(url)) {
        return res.json({ status: false, message: "Link không hợp lệ" });
    }

    try {
        const info = await ytdl.getInfo(url);
        const safeTitle = info.videoDetails.title.replace(/[^\w\s]/gi, "").replace(/\s+/g, "_");

        const videoPath = path.join(__dirname, "downloads", `${safeTitle}.mp4`);
        const audioPath = path.join(__dirname, "downloads", `${safeTitle}.mp3`);

        const audioStream = ytdl(url, { quality: "highestaudio" });

        ffmpeg(audioStream)
            .setFfmpegPath(ffmpegPath)
            .audioBitrate(128)
            .save(audioPath)
            .on("end", () => {

                const videoStream = ytdl(url, { quality: "highestvideo" });

                ffmpeg(videoStream)
                    .setFfmpegPath(ffmpegPath)
                    .videoCodec("libx264")
                    .save(videoPath)
                    .on("end", () => {

                        res.json({
                            status: true,
                            video: `${req.protocol}://${req.get("host")}/downloads/${safeTitle}.mp4`,
                            audio: `${req.protocol}://${req.get("host")}/downloads/${safeTitle}.mp3`
                        });

                    });
            });

    } catch (err) {
        res.status(500).json({
            status: false,
            message: "Lỗi hệ thống",
            error: err.message
        });
    }
});

app.listen(PORT, "0.0.0.0", () => {
    console.log("Server chạy tại port", PORT);
});
