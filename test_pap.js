import * as cheerio from 'cheerio';

async function testPap() {
    try {
        const url = "https://www.pap.fr/annonces/appartement-nice-fabron-r455601238";
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7'
            }
        });
        
        console.log("Status:", response.status);
        const html = await response.text();
        const isDatadome = html.includes('DataDome') || html.includes('captcha');
        console.log("Is Datadome/Captcha:", isDatadome);
        
        const $ = cheerio.load(html);
        console.log("Title:", $('title').text());
        console.log("OG Title:", $('meta[property="og:title"]').attr('content'));
        console.log("OG Image:", $('meta[property="og:image"]').attr('content'));
        
        // Find arrays of images if any
        const imgTags = [];
        $('img').each((i, el) => imgTags.push($(el).attr('src')));
        console.log("Images count:", imgTags.length);
        console.log("First few images:", imgTags.slice(0, 5));
        
    } catch(e) {
        console.error("Error:", e.message);
    }
}

testPap();
