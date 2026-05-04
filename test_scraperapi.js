import * as cheerio from 'cheerio';

async function testScraper() {
    const apiKey = "4368857b4361a34b269feb869664178b";
    
    // Test PAP
    const papUrl = "https://www.pap.fr/annonces/appartement-nice-fabron-r455601238";
    const scraperPapUrl = `http://api.scraperapi.com?api_key=${apiKey}&url=${encodeURIComponent(papUrl)}&premium=true`;

    try {
        console.log("Testing PAP via ScraperAPI...");
        const response = await fetch(scraperPapUrl);
        const html = await response.text();
        console.log("PAP Status:", response.status);
        console.log("Is Datadome/Captcha PAP?", html.includes('DataDome') || html.includes('captcha') || html.includes('Just a moment...'));
        const $ = cheerio.load(html);
        console.log("PAP Title:", $('title').text());
        console.log("PAP OG Image:", $('meta[property="og:image"]').attr('content'));
    } catch(e) {
        console.error("PAP Error:", e.message);
    }

    console.log("\n--------------------\n");

    // Test Leboncoin
    const lbcUrl = "https://www.leboncoin.fr/ad/locations/3185823034";
    const scraperLbcUrl = `http://api.scraperapi.com?api_key=${apiKey}&url=${encodeURIComponent(lbcUrl)}`;

    try {
        console.log("Testing Leboncoin via ScraperAPI...");
        const response = await fetch(scraperLbcUrl);
        const html = await response.text();
        console.log("LBC Status:", response.status);
        console.log("Is Datadome/Captcha LBC?", html.includes('DataDome') || html.includes('captcha') || html.includes('Just a moment...'));
        const $ = cheerio.load(html);
        console.log("LBC Title:", $('title').text());
        const cleanHtml = html.replace(/\\"/g, '"');
        const lbcMatch = cleanHtml.match(/"urls_large"\s*:\s*\[([^\]]+)\]/i) || cleanHtml.match(/"urls"\s*:\s*\[([^\]]+)\]/i);
        if (lbcMatch) {
            console.log("Found LBC Image array!");
        } else {
            console.log("No LBC image array found.");
        }
    } catch(e) {
        console.error("LBC Error:", e.message);
    }
}

testScraper();
