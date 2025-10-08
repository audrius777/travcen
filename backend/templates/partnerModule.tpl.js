// Autogeneruotas scrapinimo modulis {{COMPANY}}
import axios from 'axios';
import * as cheerio from 'cheerio';

export default async function() {
  try {
    console.log('🔍 Scrapinama: {{URL}}');
    
    const response = await axios.get('{{URL}}', {
      timeout: 20000, // Padidintas timeout
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/avif,*/*;q=0.8',
        'Accept-Language': 'lt-LT,lt;q=0.9,en;q=0.8'
      }
    });

    const $ = cheerio.load(response.data);
    const offers = [];

    // IŠPLĖSTA SCRAPINIMO LOGIKA - DAUGIAU SELEKTORIŲ
    const selectors = [
      '.tour-item', '.offer-item', '.product-item', '.trip-card',
      '.card', '.item', '[class*="tour"]', '[class*="offer"]',
      '.product', '.package', '.vacation-item', '.hotel-item',
      '.js-product-card', '.c-product-card', '.b-tour', '.b-offer',
      '.js-tour-item', '.c-tour'
    ];

    for (const selector of selectors) {
      const elements = $(selector);
      console.log('📊 {{COMPANY}} ' + selector + ': ' + elements.length + ' elementų');
      
      elements.each((index, element) => {
        try {
          const $el = $(element);
          const title = $el.find('.title, .name, h2, h3, h4, [class*="title"], [class*="name"]').first().text().trim();
          const priceText = $el.find('.price, .cost, [class*="price"], [class*="cost"], .amount').first().text().trim();
          const price = parseFloat(priceText.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
          const image = $el.find('img').first().attr('src') || '';
          const link = $el.find('a').first().attr('href') || '';

          // SUMUŽINTAS FILTRAS: title.length > 5 vietoj > 10 ir pašalintas price > 0 reikalavimas
          if (title && title.length > 5 && !title.includes('undefined')) {
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

      // PADIDINTAS LIMITAS: 20 vietoj 10
      if (offers.length > 20) break;
    }

    console.log('✅ {{COMPANY}}: Rasta ' + offers.length + ' pasiūlymų');
    return offers;

  } catch (err) {
    console.error('❌ Klaida scrapinant {{COMPANY}}:', err.message);
    
    // Grąžiname tuščią masyvą
    return [];
  }
}
