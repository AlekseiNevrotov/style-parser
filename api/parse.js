import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'Параметр url обязателен' });
    }

    // Получаем HTML страницы
    const response = await fetch(url, { timeout: 10000 });
    if (!response.ok) {
      return res.status(400).json({ error: `Не удалось загрузить страницу: ${response.statusText}` });
    }
    const html = await response.text();

    // Парсим HTML через JSDOM
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Собираем inline стили из <style>
    const inlineStyles = Array.from(document.querySelectorAll('style'))
      .map(style => style.textContent)
      .filter(Boolean);

    // Собираем href внешних стилей из <link rel="stylesheet">
    const externalCssLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
      .map(link => link.href)
      .filter(Boolean);

    // Функция загрузки CSS с обработкой ошибок
    async function fetchCss(url) {
      try {
        const resp = await fetch(url, { timeout: 8000 });
        if (!resp.ok) {
          return { url, error: `HTTP ${resp.status}` };
        }
        const contentType = resp.headers.get('content-type') || '';
        if (!contentType.includes('text/css')) {
          // Иногда css может не иметь правильный content-type, можно не критично
          // Можно убрать это условие, если хотите
        }
        const text = await resp.text();
        return { url, content: text };
      } catch (e) {
        return { url, error: e.message };
      }
    }

    // Параллельно загружаем все внешние CSS
    const externalCssContent = await Promise.all(externalCssLinks.map(fetchCss));

    res.status(200).json({
      inlineStyles,
      externalCssContent,
    });
  } catch (error) {
    res.status(500).json({ error: `Внутренняя ошибка сервера: ${error.message}` });
  }
}