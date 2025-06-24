import fetch from 'node-fetch';
import { parse } from 'node-html-parser';

export default async function handler(req, res) {
  // ✅ Разрешаем CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // ✅ Обработка preflight-запроса
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL обязателен' });
    }

    const pageResponse = await fetch(url);
    const html = await pageResponse.text();
    const root = parse(html);

    const inlineStyles = root.querySelectorAll('style').map(tag => tag.innerHTML.trim());
    const linkHrefs = root.querySelectorAll('link[rel="stylesheet"]').map(link => link.getAttribute('href')).filter(Boolean);

    const absoluteUrls = linkHrefs.map(href => new URL(href, url).href);
    const externalStyles = [];

    for (const cssUrl of absoluteUrls) {
      try {
        const cssResponse = await fetch(cssUrl);
        if (cssResponse.ok) {
          const cssText = await cssResponse.text();
          externalStyles.push(cssText.trim());
        }
      } catch (e) {
        externalStyles.push(`/* Не удалось загрузить ${cssUrl} */`);
      }
    }

    return res.status(200).json({
      inlineStyles,
      externalStylesheets: externalStyles
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}