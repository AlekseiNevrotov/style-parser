import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';

async function fetchCssContent(url, baseUrl) {
  try {
    // Приводим относительный URL к абсолютному
    const absoluteUrl = new URL(url, baseUrl).href;
    const res = await fetch(absoluteUrl);
    if (!res.ok) {
      return { url: absoluteUrl, content: null, error: `HTTP ${res.status}` };
    }
    const content = await res.text();
    return { url: absoluteUrl, content, error: null };
  } catch (e) {
    return { url, content: null, error: e.message };
  }
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    res.status(405).json({ error: 'Метод не поддерживается, нужен POST' });
    return;
  }

  const { url } = req.body || {};

  if (!url) {
    res.status(400).json({ error: 'Параметр url обязателен' });
    return;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      res.status(400).json({ error: `Ошибка загрузки страницы: ${response.status}` });
      return;
    }

    const html = await response.text();
    const dom = new JSDOM(html, { url }); // чтобы базовый URL был в контексте

    // Inline стили из <style>
    const inlineStyles = Array.from(dom.window.document.querySelectorAll('style'))
      .map(s => s.textContent.trim())
      .filter(Boolean);

    // Внешние CSS ссылки
    const externalStylesheets = Array.from(dom.window.document.querySelectorAll('link[rel="stylesheet"]'))
      .map(link => link.href)
      .filter(Boolean);

    // Получаем содержимое внешних CSS параллельно
    const externalCssContent = await Promise.all(
      externalStylesheets.map(href => fetchCssContent(href, url))
    );

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json({
      inlineStyles,
      externalStylesheets,
      externalCssContent
    });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}