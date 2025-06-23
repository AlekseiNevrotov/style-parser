// api/parse.js
import { JSDOM } from "jsdom";
import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  try {
    const response = await fetch(url);
    const html = await response.text();

    const dom = new JSDOM(html);
    const document = dom.window.document;

    const styles = Array.from(document.querySelectorAll("style")).map((el) =>
      el.textContent.trim()
    );

    const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map(
      (el) => el.href
    );

    res.status(200).json({ inlineStyles: styles, externalStylesheets: links });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch and parse styles" });
  }
}