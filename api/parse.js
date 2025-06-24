import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Метод не поддерживается. Используйте POST.' });
  }

  let body;
  try {
    body = req.body;
    // Если body пришел как строка (редко, но бывает на Vercel), парсим его
    if (typeof body === 'string') {
      body = JSON.parse(body);
    }
  } catch (err) {
    return res.status(400).json({ error: 'Некорректный JSON в теле запроса' });
  }

  const { url } = body;
  if (!url) {
    return res.status(400).json({ error: 'Параметр url обязателен' });
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return res.status(400).json({ error: `Ошибка загрузки: ${response.statusText}` });
    }

    const html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;

    const inlineStyles = Array.from(document.querySelectorAll('style'))
      .map(tag => tag.textContent.trim())
      .filter(Boolean);

    const externalStylesheets = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
      .map(link => link.href)
      .filter(Boolean);

    return res.status(200).json({
      inlineStyles,
      externalStylesheets
    });
  } catch (err) {
    return res.status(500).json({ error: `Внутренняя ошибка сервера: ${err.message}` });
  }
}