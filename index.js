const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());

// تم دمج مفتاح TMDB الخاص بك هنا
const TMDB_API_KEY = 'fe989735ac851dfb7a139a3dc228addd'; 

app.get('/', (req, res) => {
    res.json({ status: "Multi-Server Pro API is Live!" });
});

app.get('/search', async (req, res) => {
    const movieName = req.query.q;
    if (!movieName) return res.status(400).json({ error: "الرجاء إرسال اسم الفيلم" });

    try {
        // 1. البحث في قاعدة بيانات TMDB
        const tmdbUrl = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(movieName)}&language=ar`;
        const tmdbResponse = await axios.get(tmdbUrl);
        
        if (tmdbResponse.data.results.length === 0) {
            return res.json({ success: false, message: "لم يتم العثور على الفيلم" });
        }

        const movie = tmdbResponse.data.results[0];
        const tmdbId = movie.id;
        const title = movie.title || movie.original_title;

        // 2. قائمة السيرفرات العالمية المفتوحة
        const servers = [
            {
                server_name: "Embed.su (سريع + ترجمة تلقائية)",
                url: `https://embed.su/embed/movie/${tmdbId}`
            },
            {
                server_name: "VidSrc Net (مستقر)",
                url: `https://vidsrc.net/embed/movie?tmdb=${tmdbId}`
            },
            {
                server_name: "VidSrc Me (سيرفر بديل)",
                url: `https://vidsrc.me/embed/movie?tmdb=${tmdbId}`
            },
            {
                server_name: "AutoEmbed (سيرفر احتياطي)",
                url: `https://autoembed.to/movie/tmdb/${tmdbId}`
            },
            {
                server_name: "MultiEmbed (مجمع سيرفرات)",
                url: `https://multiembed.vip/?video_id=${tmdbId}&tmdb=1`
            }
        ];

        // 3. إرجاع النتيجة النهائية للتطبيق
        res.json({
            success: true,
            title: title,
            tmdb_id: tmdbId,
            overview: movie.overview,
            poster: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
            servers: servers
        });

    } catch (error) {
        res.status(500).json({ success: false, error: "حدث خطأ أثناء الاتصال", details: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});

module.exports = app;
