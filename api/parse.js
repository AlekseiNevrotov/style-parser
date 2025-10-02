const fetch = require('node-fetch');
const { JSDOM } = require('jsdom');
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { return res.status(200).end(); }
  if (req.method !== 'POST') { return res.status(405).json({ error: 'Метод не поддерживается' }); }
  const { url } = req.body || {};
  if (!url) { return res.status(400).json({ error: 'Параметр "url" обязателен' }); }
  try {
    const headResponse = await fetch(url, { method: 'HEAD' });
    const headers = headResponse.headers;
    const server = headers.get('server')?.toLowerCase() || '';
    const poweredBy = headers.get('x-powered-by')?.toLowerCase() || '';
    const via = headers.get('via')?.toLowerCase() || '';
    const response = await fetch(url);
    const html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;
    let cms = "Неизвестно";
    if (document.querySelector('meta[name="generator"][content*="WordPress"]')) { cms = "WordPress"; }
    else if (document.body.classList.contains('wp-') || html.includes('/wp-content/')) { cms = "WordPress"; }
    else if (document.body.classList.contains('joomla') || html.includes('com_content')) { cms = "Joomla"; }
    else if (document.body.classList.contains('drupal') || html.includes('sites/all/themes/')) { cms = "Drupal"; }
    else if (html.includes('<meta name="generator" content="Magento"')) { cms = "Magento"; }
    else if (html.includes('magento')) { cms = "Magento"; }
    else if (html.includes('shopify') || document.body.classList.contains('shopify') || 
             document.querySelector('meta[name="shopify-digital-wallet"]') || 
             document.querySelector('script[src*="shopify"]')) { cms = "Shopify"; }
    else if (html.includes('meta name="generator" content="Blogger"') || url.includes('.blogspot.com')) { cms = "Blogger"; }
    else if (html.includes('typo3') || html.includes('typo3conf')) { cms = "TYPO3"; }
    else if (html.includes('wix') || document.body.classList.contains('wix')) { cms = "Wix"; }
    else if (html.includes('<meta name="generator" content="Ghost"')) { cms = "Ghost"; }
    else if (html.includes('squarespace')) { cms = "Squarespace"; }
    else if (html.includes('<meta name="generator" content="Tilda Publishing"') || html.includes('data-tilda')) { cms = "Tilda"; }
    else if (html.includes('<meta name="generator" content="1C-Bitrix"') || html.includes('/bitrix/')) { cms = "1C-Битрикс"; }
    const scriptSrcs = Array.from(document.querySelectorAll('script[src]')).map(s => new URL(s.src, url).href);
    const externalLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map(link => new URL(link.href, url).href);
    const hasJS = scriptSrcs.length > 0 || html.includes('<script');
    const hasCSS = externalLinks.length > 0 || document.querySelector('style');
    let techStack = {
      languages: ['HTML'],
      frontendFrameworks: [],
      cssFrameworks: [],
      jsLibraries: [],
      backendHints: []
    };
    if (hasCSS) techStack.languages.push('CSS');
    if (hasJS) techStack.languages.push('JavaScript');
    if (scriptSrcs.some(src => src.includes('react') || src.includes('next.js') || html.includes('data-reactroot'))) {
      techStack.frontendFrameworks.push('React');
    }
    if (scriptSrcs.some(src => src.includes('vue') || html.includes('data-v-'))) {
      techStack.frontendFrameworks.push('Vue.js');
    }
    if (scriptSrcs.some(src => src.includes('angular') || html.includes('ng-') || document.querySelector('[ng-app]'))) {
      techStack.frontendFrameworks.push('Angular');
    }
    if (scriptSrcs.some(src => src.includes('svelte'))) {
      techStack.frontendFrameworks.push('Svelte');
    }
    if (externalLinks.some(link => link.includes('bootstrap'))) {
      techStack.cssFrameworks.push('Bootstrap');
    }
    if (externalLinks.some(link => link.includes('tailwind'))) {
      techStack.cssFrameworks.push('Tailwind CSS');
    }
    if (externalLinks.some(link => link.includes('bulma'))) {
      techStack.cssFrameworks.push('Bulma');
    }
    if (externalLinks.some(link => link.includes('foundation'))) {
      techStack.cssFrameworks.push('Foundation');
    }
    if (scriptSrcs.some(src => src.includes('jquery'))) {
      techStack.jsLibraries.push('jQuery');
    }
    if (scriptSrcs.some(src => src.includes('lodash'))) {
      techStack.jsLibraries.push('Lodash');
    }
    if (scriptSrcs.some(src => src.includes('three.js'))) {
      techStack.jsLibraries.push('Three.js');
    }
    if (poweredBy.includes('express')) {
      techStack.backendHints.push('Node.js / Express');
    } else if (poweredBy.includes('php')) {
      techStack.backendHints.push('PHP');
    } else if (poweredBy.includes('asp.net')) {
      techStack.backendHints.push('ASP.NET');
    } else if (server.includes('nginx') && poweredBy.includes('node')) {
      techStack.backendHints.push('Node.js (behind Nginx)');
    } else if (server.includes('apache')) {
      techStack.backendHints.push('Apache / PHP?');
    } else if (server.includes('cowboy')) {
      techStack.backendHints.push('Elixir / Phoenix');
    } else if (server.includes('gws')) {
      techStack.backendHints.push('Google (GCP? Node possible)');
    } else if (url.includes('vercel.app') || headers.get('x-vercel-id')) {
      techStack.backendHints.push('Vercel (Node.js runtime)');
    } else if (via.includes('1.1 vegur')) {
      techStack.backendHints.push('Netlify (Node.js possible)');
    } else if (url.endsWith('.php') || html.includes('<?php') || document.querySelector('meta[name="generator"][content*="PHP"]')) {
      techStack.backendHints.push('PHP');
    }
    else if (url.includes('.asp') || html.includes('<%') || document.querySelector('meta[name="generator"][content*="ASP.NET"]')) {
      techStack.backendHints.push('ASP.NET');
    }
    else if (html.includes('node.js') || scriptSrcs.some(src => src.includes('express'))) {
      techStack.backendHints.push('Node.js');
    }
    if (techStack.frontendFrameworks.length === 0) techStack.frontendFrameworks.push('Vanilla JS');
    if (techStack.cssFrameworks.length === 0) techStack.cssFrameworks.push('Custom CSS');
    if (techStack.backendHints.length === 0) techStack.backendHints.push('Неизвестно');
    const inlineStyles = Array.from(document.querySelectorAll('style')).map(style => style.textContent.trim()).filter(Boolean);
    const externalCssContents = [];
    for (const cssUrl of externalLinks) {
      try {
        const cssRes = await fetch(cssUrl);
        const cssText = await cssRes.text();
        externalCssContents.push(cssText);
      } catch (e) { console.warn('Не удалось загрузить:', cssUrl); }
    }
    const allCss = [...inlineStyles, ...externalCssContents].join('\n\n');
    return res.status(200).json({ css: allCss, cms: cms, techStack: techStack });
  } catch (error) {
    console.error('Ошибка парсинга:', error.message);
    return res.status(500).json({ error: 'Ошибка парсинга страницы' });
  }
};