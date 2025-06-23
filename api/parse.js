import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';

export default async function handler(req, res) {
  // CORS
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
    const response = await fetch(url);

    const text = await response.text();

    if (!response.ok) {
      // Возвращаем статус и первые 200 символов текста ошибки
      return res.status(response.status).json({
        error: `Ошибка загрузки страницы: ${response.status}`,
        details: text.slice(0, 200),
      });
    }

    // Парсим DOM из полученного текста
    const dom = new JSDOM(text);

    // Собираем inline стили (теги <style>)
    const inlineStyles = Array.from(dom.window.document.querySelectorAll('style'))
      .map(styleTag => styleTag.textContent.trim())
      .filter(Boolean);

    // Собираем внешние CSS (href из <link rel="stylesheet">)
    const externalStylesheets = Array.from(dom.window.document.querySelectorAll('link[rel="stylesheet"]'))
      .map(link => link.href)
      .filter(Boolean);

    res.status(200).json({ inlineStyles, externalStylesheets });
  } catch (error) {
    res.status(500).json({ error: `Ошибка сервера: ${error.message}` });
  }
}