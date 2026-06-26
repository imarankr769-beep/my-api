const express = require('express');
const axios = require('axios');
const app = express();

app.get('/search', async (req, res) => {
    const movieName = req.query.q;
    try {
        // إضافة User-Agent للتمويه
        const config = { headers: { 'User-Agent': 'Mozilla/5.0' } };

        // 1. بحث TMDB
        const tmdbRes = await axios.get(`https://api.themoviedb.org/3/search/movie?api_key=fe989735ac851dfb7a139a3dc228addd&query=${encodeURIComponent(movieName)}`, config);
        const movie = tmdbRes.data.results[0];
        
        // 2. جلب الـ IMDB
        const detailsRes = await axios.get(`https://api.themoviedb.org/3/movie/${movie.id}?api_key=fe989735ac851dfb7a139a3dc228addd`, config);
        const imdbId = detailsRes.data.imdb_id;

        // 3. الاتصال بمحرك التورنت
        const torrentRes = await axios.get(`https://torrentio.strem.fun/stream/movie/${imdbId}.json`, config);
        
        if (!torrentRes.data.streams || torrentRes.data.streams.length === 0) {
            return res.json({ error: "لا توجد نتائج تورنت لهذا الفيلم" });
        }

        const magnet = `magnet:?xt=urn:btih:${torrentRes.data.streams[0].infoHash}`;

        res.json({
            title: movie.title,
            poster: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
            magnet_link: magnet
        });
    } catch (error) {
        res.status(500).json({ error: "تعذر الاتصال بالمصادر: " + error.message });
    }
});

app.listen(process.env.PORT || 3000);
