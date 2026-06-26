const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
app.use(cors());

// إعداد الترويسات (Headers) للظهور كمتصفح حقيقي وتخطي بعض الحمايات
const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'ar,en-US;q=0.7,en;q=0.3',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1'
};

app.get('/', (req, res) => {
    res.json({ status: "Scraper API is Live & Ready!" });
});

app.get('/search', async (req, res) => {
    const movieName = req.query.q;
    
    if (!movieName) {
        return res.status(400).json({ error: "الرجاء إرسال اسم الفيلم للبحث" });
    }

    try {
        // ==========================================
        // القسم الأول: البحث في موقع MyCima
        // ==========================================
        const targetSiteUrl = 'https://mycima.camp'; 
        // استبدال المسافات بعلامة + لتناسب رابط البحث
        const searchUrl = `${targetSiteUrl}/search/${encodeURIComponent(movieName).replace(/%20/g, '+')}`;
        
        const searchResponse = await axios.get(searchUrl, { headers: HEADERS });
        const $ = cheerio.load(searchResponse.data);
        
        // استخراج رابط أول فيلم يظهر في نتائج ماي سيما
        let firstMovieLink = $('.GridItem a').attr('href') || $('.Thumb--GridItem a').attr('href');
        
        if (!firstMovieLink) {
            return res.json({ success: false, message: "لم يتم العثور على الفيلم في MyCima." });
        }

        // ==========================================
        // القسم الثاني: الدخول لصفحة الفيلم واستخراج المشغل
        // ==========================================
        const moviePageResponse = await axios.get(firstMovieLink, { headers: HEADERS });
        const $$ = cheerio.load(moviePageResponse.data);
        
        let videoLink = null;

        // ماي سيما يضع سيرفرات المشاهدة داخل وسوم iframe
        const iframeSrc = $$('.Watch--Server iframe').attr('src') || $$('iframe').attr('src');
        
        if (iframeSrc) {
            videoLink = iframeSrc; 
        } else {
             // البحث عن أزرار التحميل المباشرة كبديل في حال عدم وجود مشغل
             const downloadLink = $$('.List--Download--Wecima--Single a').attr('href');
             if(downloadLink) videoLink = downloadLink;
        }

        // ==========================================
        // القسم الثالث: إرجاع النتيجة
        // ==========================================
        if (videoLink) {
            res.json({ 
                success: true, 
                query: movieName, 
                movie_page: firstMovieLink,
                video_url: videoLink 
            });
        } else {
            res.json({ 
                success: false, 
                message: "تم العثور على الفيلم لكن لم نتمكن من استخراج رابط المشغل." 
            });
        }

    } catch (error) {
        res.status(500).json({ 
            success: false,
            error: "حدث خطأ أثناء الاتصال بالسيرفر. قد يكون الموقع محمي بـ Cloudflare.", 
            details: error.message 
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});

module.exports = app;
