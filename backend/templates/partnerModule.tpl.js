// Autogeneruotas scrapinimo modulis {{COMPANY}}
import axios from 'axios';
import * as cheerio from 'cheerio';

export default async function() {
  try {
    console.log('🔍 Scrapinama: {{URL}}');
    
    const response = await axios.get('{{URL}}', {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/avif,*/*;q=0.8',
        'Accept-Language': 'lt-LT,lt;q=0.9,en;q=0.8'
      }
    });

    const $ = cheerio.load(response.data);
    const offers = [];

    // BENDRA SCRAPINIMO LOGIKA
    $('.product, .item, .card, .offer, .tour, .package, [class*="product"], [class*="item"]').each((index, element) => {
      try {
        const $el = $(element);
        const title = $el.find('h1, h2, h3, .title, .name').first().text().trim();
        const priceText = $el.find('.price, .cost, [class*="price"]').first().text().trim();
        const price = parseFloat(priceText.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
        const image = $el.find('img').first().attr('src') || '';
        const link = $el.find('a').first().attr('href') || '';

        if (title && title.length > 10 && price > 0) {
          const fullImage = image.startsWith('http') ? image : 
                           image.startsWith('//') ? 'https:' + image : 
                           image ? new URL(image, '{{URL}}').href : 
                           'https://source.unsplash.com/featured/300x200/?travel';
          
          const fullLink = link.startsWith('http') ? link : 
                          link.startsWith('//') ? 'https:' + link : 
                          link ? new URL(link, '{{URL}}').href : '{{URL}}';

          offers.push({
            title: title.substring(0, 100),
            from: "Vilnius",
            to: "Kelionė",
            type: "cultural",
            price: price,
            url: fullLink,
            image: fullImage,
            partner: '{{COMPANY}}'
          });
        }
      } catch (err) {
        console.log('Klaida apdorojant elementą:', err.message);
      }
    });

    // Jei nerandame struktūruotų duomenų, bandome alternatyvų būdą
    if (offers.length === 0) {
      $('a').each((index, element) => {
        const $el = $(element);
        const text = $el.text().trim();
        const href = $el.attr('href') || '';
        
        if (text.length > 20 && href) {
          offers.push({
            title: text.substring(0, 80),
            from: "Vilnius", 
            to: "Kelionė",
            type: "cultural",
            price: 0,
            url: href.startsWith('http') ? href : new URL(href, '{{URL}}').href,
            image: 'https://source.unsplash.com/featured/300x200/?travel',
            partner: '{{COMPANY}}',
            note: 'Rasta per bendrą paiešką'
          });
        }
      });
    }

    console.log('✅ Rasta ' + offers.length + ' pasiūlymų iš {{COMPANY}}');
    return offers;

  } catch (err) {
    console.error('❌ Klaida scrapinant {{COMPANY}}:', err.message);
    
    // Grąžiname tuščią masyvą, bet su klaidos informacija
    return [{
      title: 'Scrapinimo klaida: ' + err.message,
      from: "Vilnius",
      to: "Klaida",
      type: "cultural", 
      price: 0,
      url: '{{URL}}',
      image: 'https://source.unsplash.com/featured/300x200/?error',
      partner: '{{COMPANY}}',
      error: true
    }];
  }
}
