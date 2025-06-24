// api/parse.js
const fetch = require('node-fetch');
const { JSDOM } = require('jsdom');

module.exports = async (req, res) => {
  // Добавляем CORS-заголовки
  res.setHeader('Access-Control-Allow-Origin', '*'); // Можно заменить '*' на 'https://web-design.spb.ru'
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    // Предварительный запрос
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Метод не поддерживается' });
  }

  const { url } = req.body || {};

  if (!url) {
    return res.status(400).json({ error: 'Параметр "url" обязателен' });
  }

  try {
    const response = await fetch(url);
    const html = await response.text();

    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Inline стили
    const inlineStyles = Array.from(document.querySelectorAll('style'))
      .map(style => style.textContent.trim())
      .filter(Boolean);

    // Внешние стили
    const externalLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
      .map(link => new URL(link.href, url).href);

    // Загрузка внешнего CSS
    const externalCssContents = [];
    for (const cssUrl of externalLinks) {
      try {
        const cssRes = await fetch(cssUrl);
        const cssText = await cssRes.text();
        externalCssContents.push(cssText);
      } catch (e) {
        console.warn('Не удалось загрузить:', cssUrl);
      }
    }

    const allCss = [...inlineStyles, ...externalCssContents].join('\n\n');

    return res.status(200).json({ css: allCss });

  } catch (error) {
    console.error('Ошибка парсинга:', error.message);
    return res.status(500).json({ error: 'Ошибка парсинга страницы' });
  }
};