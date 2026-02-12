import { Readability } from '@mozilla/readability';
import TurndownService from 'turndown';

console.log('content script loaded');

declare global {
  interface Window {
    turn2Markdown: (selector?: string) => string;
    parserReadability: () => any;
  }
}

window.parserReadability = () => {
  try {
    const documentClone = document.cloneNode(true) as Document;
    const reader = new Readability(documentClone);
    const article = reader.parse();

    if (article) {
      const turndownService = new TurndownService();
      // Add markdown conversion for the article content
      // @ts-expect-error - Adding custom property
      article.markdown = turndownService.turndown(article.content);
    }

    return article;
  } catch (error) {
    console.error('Readability parsing failed:', error);
    return null;
  }
};

window.turn2Markdown = (selector?: string) => {
  try {
    const turndownService = new TurndownService();
    if (selector) {
      const element = document.querySelector(selector);
      return element ? turndownService.turndown(element as HTMLElement) : '';
    }
    return turndownService.turndown(document.body);
  } catch (error) {
    console.error('Markdown conversion failed:', error);
    return '';
  }
};
