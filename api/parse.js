const fetch = require('node-fetch');
const { JSDOM } = require('jsdom');
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { return res.status(200).end(); }
  if (req.method !== 'POST') { return res.status(405).json({ error: 'Метод не поддерживается' }); }
  const { url } = req.body || {};
  if (!url) { return res.status(400).json({ error: 'Параметр "url" обязателен' }); }
  try {
    const response = await fetch(url);
    const html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;
    let cms = "Неизвестно";
    if (document.querySelector('meta[name="generator"][content*="WordPress"]')) { cms = "WordPress"; }
    else if (document.body.classList.contains('wp-') || html.includes('/wp-content/')) { cms = "WordPress"; }
    else if (document.body.classList.contains('joomla') || html.includes('com_content')) { cms = "Joomla"; }
    else if (document.body.classList.contains('drupal') || html.includes('sites/all/themes/')) { cms = "Drupal"; }
    else if (html.includes('<meta name="generator" content="Magento"')) { cms = "Magento"; }
    else if (html.includes('magento')) { cms = "Magento"; }
    else if (html.includes('shopify') || document.body.classList.contains('shopify') || 
             document.querySelector('meta[name="shopify-digital-wallet"]') || 
             document.querySelector('script[src*="shopify"]')) { cms = "Shopify"; }
    else if (html.includes('meta name="generator" content="Blogger"') || url.includes('.blogspot.com')) { cms = "Blogger"; }
    else if (html.includes('typo3') || html.includes('typo3conf')) { cms = "TYPO3"; }
    else if (html.includes('wix') || document.body.classList.contains('wix')) { cms = "Wix"; }
    else if (html.includes('<meta name="generator" content="Ghost"')) { cms = "Ghost"; }
    else if (html.includes('squarespace')) { cms = "Squarespace"; }
    else if (html.includes('<meta name="generator" content="Tilda Publishing"') || html.includes('data-tilda')) { cms = "Tilda"; }
    else if (html.includes('<meta name="generator" content="1C-Bitrix"') || html.includes('/bitrix/')) { cms = "1C-Битрикс"; }
    const inlineStyles = Array.from(document.querySelectorAll('style')).map(style => style.textContent.trim()).filter(Boolean);
    const externalLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map(link => new URL(link.href, url).href);
    const externalCssContents = [];
    for (const cssUrl of externalLinks) {
      try {
        const cssRes = await fetch(cssUrl);
        const cssText = await cssRes.text();
        externalCssContents.push(cssText);
      } catch (e) { console.warn('Не удалось загрузить:', cssUrl); }
    }
    const allCss = [...inlineStyles, ...externalCssContents].join('\n\n');
    return res.status(200).json({ css: allCss, cms: cms });
  } catch (error) {
    console.error('Ошибка парсинга:', error.message);
    return res.status(500).json({ error: 'Ошибка парсинга страницы' });
  }
};