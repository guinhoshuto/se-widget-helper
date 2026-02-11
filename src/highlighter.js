import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import 'highlight.js/styles/tokyo-night-dark.css';

hljs.registerLanguage('javascript', javascript);

export function highlight(code, el) {
  el.textContent = code;
  if (code) {
    hljs.highlightElement(el);
  }
}
