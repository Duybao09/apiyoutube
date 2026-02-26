const express = require("express");
const cors = require("cors");
const ytdl = require("@distube/ytdl-core");

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = "htrang245"; // đổi nếu muốn

app.use(cors());

app.get("/", (req, res) => {
    res.send("🔥 API DOWNLOAD YOUTUBE MP4 🔥");
});

app.get("/api/youtube/mp4", async (req, res) => {
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
        const title = info.videoDetails.title.replace(/[^\w\s]/gi, "");

        res.header("Content-Disposition", `attachment; filename="${title}.mp4"`);
        res.header("Content-Type", "video/mp4");

        ytdl(url, {
            quality: "highest",
            filter: "audioandvideo"
        }).pipe(res);

    } catch (err) {
        res.status(500).json({
            status: false,
            message: "Lỗi tải video",
            error: err.message
        });
    }
});

app.listen(PORT, "0.0.0.0", () => {
    console.log("Server chạy tại port", PORT);
});
