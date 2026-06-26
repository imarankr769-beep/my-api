const express = require('express');
const axios = require('axios');
const app = express();

app.get('/search', async (req, res) => {
    const movieName = req.query.q;
    try {
        // نستخدم وكيل وسيط لتجاوز الحظر
        const proxy = "https://corsproxy.io/?"; 
        
        const tmdbRes = await axios.get(`https://api.themoviedb.org/3/search/movie?api_key=fe989735ac851dfb7a139a3dc228addd&query=${encodeURIComponent(movieName)}`);
        const movie = tmdbRes.data.results[0];
        const imdbId = (await axios.get(`https://api.themoviedb.org/3/movie/${movie.id}?api_key=fe989735ac851dfb7a139a3dc228addd`)).data.imdb_id;

        // الاتصال عبر الوكيل لتخطي حظر الـ 403
        const torrentUrl = `https://torrentio.strem.fun/stream/movie/${imdbId}.json`;
        const torrentRes = await axios.get(proxy + encodeURIComponent(torrentUrl));
        
        const magnet = `magnet:?xt=urn:btih:${torrentRes.data.streams[0].infoHash}`;

        res.json({
            title: movie.title,
            poster: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
            magnet_link: magnet
        });
    } catch (error) {
        res.status(500).json({ error: "تعذر الاتصال: " + error.message });
    }
});

app.listen(process.env.PORT || 3000);
