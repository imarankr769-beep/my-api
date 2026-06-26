const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());

const TMDB_API_KEY = 'fe989735ac851dfb7a139a3dc228addd'; 

app.get('/search', async (req, res) => {
    const movieName = req.query.q;
    try {
        // 1. بحث TMDB
        const tmdbRes = await axios.get(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(movieName)}&language=ar`);
        const movie = tmdbRes.data.results[0];
        const imdbId = (await axios.get(`https://api.themoviedb.org/3/movie/${movie.id}?api_key=${TMDB_API_KEY}`)).data.imdb_id;

        // 2. محرك التورنت (Torrentio)
        const torrentRes = await axios.get(`https://torrentio.strem.fun/stream/movie/${imdbId}.json`);
        const bestStream = torrentRes.data.streams[0]; // نأخذ أفضل رابط (أعلى جودة)

        res.json({
            title: movie.title,
            poster: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
            magnet_link: `magnet:?xt=urn:btih:${bestStream.infoHash}` // هذا هو الرابط الذي سيشغله تطبيقك
        });
    } catch (error) {
        res.status(500).json({ error: "خطأ في الاتصال" });
    }
});

app.listen(3000);
