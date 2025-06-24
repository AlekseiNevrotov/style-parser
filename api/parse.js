import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Метод не поддерживается. Используйте POST.' });
    return;
  }

  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'Параметр url обязателен' });
    }

    const response = await fetch(url);
    const html = await response.text();
    const dom = new JSDOM(html);

    const inlineStyles = Array.from(dom.window.document.querySelectorAll('style'))
      .map(tag => tag.textContent.trim());

    const externalStylesheets = Array.from(dom.window.document.querySelectorAll('link[rel="stylesheet"]'))
      .map(link => link.href);

    res.status(200).json({ inlineStyles, externalStylesheets });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}