import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';

async function fetchCssContent(url) {
  try {
    const resp = await fetch(url);
    if (!resp.ok) {
      return { url, content: null, error: `HTTP ${resp.status}` };
    }
    const cssText = await resp.text();
    return { url, content: cssText, error: null };
  } catch (e) {
    return { url, content: null, error: e.message };
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Метод не поддерживается, нужен POST' });
    return;
  }

  const { url } = req.body;
  if (!url) {
    res.status(400).json({ error: 'Параметр url обязателен' });
    return;
  }

  try {
    const pageResp = await fetch(url);
    if (!pageResp.ok) {
      res.status(400).json({ error: `Ошибка загрузки страницы: ${pageResp.status}` });
      return;
    }
    const html = await pageResp.text();

    const dom = new JSDOM(html, { url }); // важен базовый url для относительных ссылок

    // Inline стили
    const inlineStyles = Array.from(dom.window.document.querySelectorAll('style'))
      .map(el => el.textContent.trim())
      .filter(Boolean);

    // Ссылки на внешние CSS (приводим к абсолютным URL)
    const externalStylesheets = Array.from(dom.window.document.querySelectorAll('link[rel="stylesheet"]'))
      .map(link => new URL(link.href, url).href);

    // Параллельно скачиваем содержимое внешних CSS
    const externalCssContent = await Promise.all(
      externalStylesheets.map(href => fetchCssContent(href))
    );

    res.status(200).json({
      inlineStyles,
      externalStylesheets,
      externalCssContent,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}