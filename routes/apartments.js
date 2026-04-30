import express from 'express';
import Apartment from '../models/Apartment.js';
import axios from 'axios';
import * as cheerio from 'cheerio';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const apartments = await Apartment.find().sort({ createdAt: -1 });
    res.json(apartments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/scrape', async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ message: 'URL manquante' });
  }

  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    
    let imageUrl = $('meta[property="og:image"]').attr('content') || $('meta[name="og:image"]').attr('content');
    if (imageUrl && imageUrl.includes('bienici.com') && imageUrl.includes('share.png')) {
      imageUrl = ''; // On ignore le logo générique de BienIci
    }
    const title = $('meta[property="og:title"]').attr('content') || $('title').text() || '';
    const description = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || '';

    const textToAnalyze = title + ' ' + description;
    const rawHtml = response.data;
    
    // Extraction des données avec Regex sur le texte visible
    let price = '';
    let rooms = '';
    let surface = '';
    let phone = '';
    let neighborhood = '';
    let contactName = '';

    // --- 1. Tentative d'extraction intelligente depuis les objets JSON (Next.js ou JSON-LD)
    const cleanHtml = rawHtml.replace(/\\"/g, '"'); // Nettoyage des quotes échappées fréquentes dans le state React
    
    // On ignore les prix à 0 (qui sont souvent des prix d'options ou des balises vides)
    const jsonPriceMatch = cleanHtml.match(/"price"\s*:\s*\[?\s*([1-9]\d*)\s*\]?(?!\d)/i) 
                        || cleanHtml.match(/"price"\s*:\s*"([1-9]\d*)"/i)
                        || cleanHtml.match(/"price"\s*:\s*\{"value"\s*:\s*"(\d[\d\s\.,]*)\s*€"/i);
    if (jsonPriceMatch && jsonPriceMatch[1]) {
      price = parseInt(jsonPriceMatch[1].replace(/\s/g, '').replace('.', '').replace(',', ''), 10).toString();
    }

    const contactMatch = cleanHtml.match(/"contactCard"\s*:\s*\{"title"\s*:\s*"([^"]+)"/i) // Seloger exact
                      || cleanHtml.match(/"intermediaryCard"\s*:\s*\{"title"\s*:\s*"([^"]+)"/i) // Seloger agence exact
                      || cleanHtml.match(/"contactName"\s*:\s*"([^"]+)"/i) 
                      || cleanHtml.match(/"agencyName"\s*:\s*"([^"]+)"/i)
                      || cleanHtml.match(/"owner"\s*:\s*\{[^}]*"name"\s*:\s*"([^"]+)"/i) // Leboncoin
                      || cleanHtml.match(/"store_name"\s*:\s*"([^"]+)"/i) // Leboncoin pro
                      || cleanHtml.match(/"contact"\s*:\s*\{[^}]*"name"\s*:\s*"([^"]+)"/i) // Seloger
                      || cleanHtml.match(/"agency"\s*:\s*\{[^}]*"name"\s*:\s*"([^"]+)"/i) // Seloger
                      || cleanHtml.match(/"professional"\s*:\s*\{[^}]*"name"\s*:\s*"([^"]+)"/i); // Seloger
    if (contactMatch && contactMatch[1]) contactName = contactMatch[1];

    // Extraction JSON-LD très précise (souvent utilisée par SeLoger)
    if (!contactName) {
      $('script[type="application/ld+json"]').each((i, el) => {
        try {
          const jsonText = $(el).html();
          if (jsonText && jsonText.includes('name')) {
            const json = JSON.parse(jsonText);
            const findContactName = (obj) => {
              if (!obj || typeof obj !== 'object') return null;
              if (obj['@type'] && (obj['@type'] === 'RealEstateAgent' || obj['@type'] === 'Person' || obj['@type'] === 'Organization')) {
                 if (obj.name && typeof obj.name === 'string') {
                    const lowerName = obj.name.toLowerCase();
                    if (!lowerName.includes('seloger') && !lowerName.includes('leboncoin') && !lowerName.includes('bienici')) {
                       return obj.name;
                    }
                 }
              }
              for (let key in obj) {
                const res = findContactName(obj[key]);
                if (res) return res;
              }
              return null;
            };
            const extractedName = findContactName(json);
            if (extractedName) contactName = extractedName;
          }
        } catch(e) {}
      });
    }

    // --- 2. Fallbacks avec expressions régulières sur le titre et la description
    if (!price) {
      const priceMatchText = textToAnalyze.match(/(\d[\d\s\.,]*)\s*(?:€|euros)/i);
      if (priceMatchText) {
        price = parseInt(priceMatchText[1].replace(/\s/g, '').replace('.', '').replace(',', ''), 10).toString();
      }
    }

    const roomsMatch = textToAnalyze.match(/(\d+)\s*(?:pièces?|p\.)/i) || textToAnalyze.match(/[TF](\d+)/i);
    if (roomsMatch) rooms = parseInt(roomsMatch[1], 10).toString();

    const surfaceMatch = textToAnalyze.match(/(\d+[\.,]?\d*)\s*(?:m²|m2)/i);
    if (surfaceMatch) surface = parseFloat(surfaceMatch[1].replace(',', '.')).toString();

    // Extraction précise du quartier depuis le JSON
    const jsonNeighMatch = cleanHtml.match(/"neighborhood"\s*:\s*"([^"]+)"/i)
                        || cleanHtml.match(/"district"\s*:\s*"([^"]+)"/i);
    if (jsonNeighMatch && jsonNeighMatch[1]) {
      neighborhood = jsonNeighMatch[1];
    }

    if (!neighborhood) {
      const cpMatch = textToAnalyze.match(/\b([0-9]{5})\b/);
      if (cpMatch) neighborhood = cpMatch[1];
    }

    res.json({ imageUrl, title, price, rooms, surface, neighborhood, contactName });
  } catch (error) {
    console.error("Erreur lors du scraping de l'URL:", url, error.message);
    res.status(500).json({ 
      message: 'Impossible de scraper cette URL (blocage anti-bot ou URL invalide).',
      error: error.message
    });
  }
});

router.post('/', async (req, res) => {
  const apartment = new Apartment(req.body);
  try {
    const newApartment = await apartment.save();
    res.status(201).json(newApartment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const updatedApartment = await Apartment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedApartment) {
      return res.status(404).json({ message: 'Appartement non trouvé' });
    }
    res.json(updatedApartment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const deletedApartment = await Apartment.findByIdAndDelete(req.params.id);
    if (!deletedApartment) {
      return res.status(404).json({ message: 'Appartement non trouvé' });
    }
    res.json({ message: 'Appartement supprimé' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
