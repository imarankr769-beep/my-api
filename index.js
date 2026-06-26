const express = require('express');
const axios = require('axios');
const app = express();

const TMDB_API = 'fe989735ac851dfb7a139a3dc228addd';

app.get('/search', async (req, res) => {
    const movieName = req.query.q;
    try {
        // 1. جلب بيانات الفيلم من TMDB
        const tmdbRes = await axios.get(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API}&query=${encodeURIComponent(movieName)}`);
        const movie = tmdbRes.data.results[0];
        
        // 2. جلب رقم الـ IMDB (المفتاح السحري للتورنت)
        const detailsRes = await axios.get(`https://api.themoviedb.org/3/movie/${movie.id}?api_key=${TMDB_API}`);
        
        res.json({
            title: movie.title,
            poster: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
            imdb_id: detailsRes.data.imdb_id // هذا كل ما يحتاجه تطبيقك
        });
    } catch (error) {
        res.status(500).json({ error: "تعذر جلب البيانات" });
    }
});

app.listen(process.env.PORT || 3000);
