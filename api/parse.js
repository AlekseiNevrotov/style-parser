import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';

export default async function handler(req, res) {
  // CORS-заголовки — разрешаем запросы с любых источников
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Обработка preflight-запросов OPTIONS (для CORS)
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.status(200).end();
    return;
  }

  // Проверяем, что метод POST
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Метод не поддерживается, нужен POST' });
    return;
  }

  const { url } = req.body;

  // Проверяем, что передан url
  if (!url) {
    res.status(400).json({ error: 'Параметр url обязателен' });
    return;
  }

  try {
    // Загружаем HTML по url
    const response = await fetch(url);
    if (!response.ok) {
      res.status(400).json({ error: `Ошибка загрузки страницы: ${response.status}` });
      return;
    }
    const html = await response.text();

    // Парсим DOM с помощью jsdom
    const dom = new JSDOM(html);

    // Собираем inline-стили (в тегах <style>)
    const inlineStyles = Array.from(dom.window.document.querySelectorAll('style'))
      .map(styleTag => styleTag.textContent.trim());

    // Собираем внешние css (ссылки <link rel="stylesheet">)
    const externalStylesheets = Array.from(dom.window.document.querySelectorAll('link[rel="stylesheet"]'))
      .map(link => link.href);

    // Отдаем результат
    res.status(200).json({
      inlineStyles,
      externalStylesheets
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}