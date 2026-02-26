const express = require("express");
const cors = require("cors");
const ytdl = require("ytdl-core");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

// 🔐 API KEY ghi trực tiếp trong code
const API_KEY = "htrang245";

app.use(cors());
app.use(express.json());
app.use("/downloads", express.static("downloads"));

// Tạo thư mục downloads nếu chưa có
if (!fs.existsSync("downloads")) {
    fs.mkdirSync("downloads");
}

// =========================
// TRANG CHỦ
// =========================
app.get("/", (req, res) => {
    res.send("🔥 API YOUTUBE MP4 + MP3 - BY DUY BAO 🔥");
});

// =========================
// API TẢI VIDEO + AUDIO
// =========================
app.get("/api/youtube/download", async (req, res) => {

    const { url, apikey } = req.query;

    if (apikey !== API_KEY) {
        return res.status(403).json({
            status: false,
            message: "Sai API key"
        });
    }

    if (!url || !ytdl.validateURL(url)) {
        return res.json({
            status: false,
            message: "Link YouTube không hợp lệ"
        });
    }

    try {

        const info = await ytdl.getInfo(url);
        const safeTitle = info.videoDetails.title
            .replace(/[^\w\s]/gi, "")
            .replace(/\s+/g, "_");

        const videoPath = path.join(__dirname, "downloads", `${safeTitle}.mp4`);
        const audioPath = path.join(__dirname, "downloads", `${safeTitle}.mp3`);

        // ====== TẢI AUDIO ======
        const audioStream = ytdl(url, { quality: "highestaudio" });

        ffmpeg(audioStream)
            .setFfmpegPath(ffmpegPath)
            .audioBitrate(128)
            .save(audioPath)
            .on("end", () => {

                // ====== TẢI VIDEO ======
                const videoStream = ytdl(url, { quality: "highestvideo" });

                ffmpeg(videoStream)
                    .setFfmpegPath(ffmpegPath)
                    .videoCodec("libx264")
                    .save(videoPath)
                    .on("end", () => {

                        res.json({
                            status: true,
                            author: "API BY DUYBAO",
                            title: safeTitle,
                            video: `${req.protocol}://${req.get("host")}/downloads/${safeTitle}.mp4`,
                            audio: `${req.protocol}://${req.get("host")}/downloads/${safeTitle}.mp3`
                        });

                        // Tự xóa file sau 5 phút
                        setTimeout(() => {
                            if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
                            if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
                        }, 300000);

                    })
                    .on("error", (err) => {
                        res.status(500).json({
                            status: false,
                            message: "Lỗi xử lý video",
                            error: err.message
                        });
                    });

            })
            .on("error", (err) => {
                res.status(500).json({
                    status: false,
                    message: "Lỗi xử lý audio",
                    error: err.message
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
