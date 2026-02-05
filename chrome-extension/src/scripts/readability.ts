import { Readability } from '@mozilla/readability';

declare global {
  interface Window {
    parserReadability: () => any;
  }
}

window.parserReadability = function() {
  const documentClone = document.cloneNode(true) as Document;
  const reader = new Readability(documentClone);
  return reader.parse();
};
