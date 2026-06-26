const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());

// مفتاح TMDB الخاص بك
const TMDB_API_KEY = 'fe989735ac851dfb7a139a3dc228addd'; 

app.get('/', (req, res) => {
    res.json({ status: "Ultimate API (Embeds + Torrents) is Live!" });
});

app.get('/search', async (req, res) => {
    const movieName = req.query.q;
    if (!movieName) return res.status(400).json({ error: "الرجاء إرسال اسم الفيلم" });

    try {
        // 1. البحث الأولي في TMDB
        const tmdbSearchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(movieName)}&language=ar`;
        const searchRes = await axios.get(tmdbSearchUrl);
        
        if (searchRes.data.results.length === 0) {
            return res.json({ success: false, message: "لم يتم العثور على الفيلم" });
        }

        const movie = searchRes.data.results[0];
        const tmdbId = movie.id;

        // 2. جلب تفاصيل الفيلم العميقة (للحصول على رقم IMDB المطلوب للتورنت)
        const tmdbDetailsUrl = `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${TMDB_API_KEY}&language=ar`;
        const detailsRes = await axios.get(tmdbDetailsUrl);
        const imdbId = detailsRes.data.imdb_id;

        // 3. صيد روابط التورنت من YTS
        let torrents = [];
        if (imdbId) {
            try {
                const yts
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
