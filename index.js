const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());

// مفتاح TMDB الخاص بك
const TMDB_API_KEY = 'fe989735ac851dfb7a139a3dc228addd'; 

// ترويسات عامة للظهور كمتصفح
const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
    'Referer': 'https://embed.su/'
};

app.get('/', (req, res) => {
    res.json({ status: "Pro API + Extractor is Live!" });
});

// ==========================================
// 1. مسار البحث (لجلب قائمة السيرفرات)
// ==========================================
app.get('/search', async (req, res) => {
    const movieName = req.query.q;
    if (!movieName) return res.status(400).json({ error: "الرجاء إرسال اسم الفيلم" });

    try {
        const tmdbUrl = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(movieName)}&language=ar`;
        const tmdbResponse = await axios.get(tmdbUrl);
        
        if (tmdbResponse.data.results.length === 0) {
            return res.json({ success: false, message: "لم يتم العثور على الفيلم" });
        }

        const movie = tmdbResponse.data.results[0];
        const tmdbId = movie.id;

        res.json({
            success: true,
            title: movie.title || movie.original_title,
            tmdb_id: tmdbId,
            overview: movie.overview,
            poster: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
            servers: [
                { server_name: "Embed.su", url: `https://embed.su/embed/movie/${tmdbId}` },
                { server_name: "VidSrc Net", url: `https://vidsrc.net/embed/movie?tmdb=${tmdbId}` }
            ]
        });
    } catch (error) {
        res.status(500).json({ success: false, error: "حدث خطأ أثناء الاتصال" });
    }
});

// ==========================================
// 2. مسار الاستخراج (Extractor) - لسحب m3u8 النقي
// ==========================================
app.get('/extract', async (req, res) => {
    const targetUrl = req.query.url;
    if (!targetUrl) return res.status(400).json({ error: "الرجاء إرسال رابط الـ Embed" });

    try {
        // الدخول لصفحة المشغل
        const response = await axios.get(targetUrl, { headers: HEADERS });
        const html = response.data;

        let rawLink = null;

        // الطريقة الأولى: البحث المباشر عن m3u8 في الكود المصدري
        const m3u8Regex = /(https:\/\/[^\s"'<>]*\.m3u8[^\s"'<>]*)/gi;
        const directMatch = html.match(m3u8Regex);
        
        if (directMatch && directMatch.length > 0) {
            rawLink = directMatch[0];
        } 
        // الطريقة الثانية: البحث عن نصوص مشفرة بـ Base64 (تقنية شائعة في Embed.su)
        else {
            const base64Regex = /atob\(['"]([^'"]+)['"]\)/gi;
            let match;
            while ((match = base64Regex.exec(html)) !== null) {
                try {
                    const decoded = Buffer.from(match[1], 'base64').toString('utf-8');
                    if (decoded.includes('.m3u8')) {
                        // استخراج الرابط من النص الذي تم فك تشفيره
                        const extractedMatch = decoded.match(m3u8Regex);
                        if (extractedMatch) rawLink = extractedMatch[0];
                        break;
                    }
                } catch (e) {
                    continue; // تجاوز الأخطاء إذا لم يكن النص Base64 صحيحاً
                }
            }
        }

        if (rawLink) {
            res.json({ success: true, source_url: targetUrl, direct_link: rawLink });
        } else {
            res.json({ success: false, message: "لم يتم العثور على رابط مباشر. قد تكون خوارزمية التشفير قد تغيرت." });
        }

    } catch (error) {
        res.status(500).json({ success: false, error: "فشل في سحب أو تحليل الصفحة" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});

module.exports = app;
