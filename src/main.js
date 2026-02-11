import { generate } from './generator.js';
import { highlight } from './highlighter.js';
import './style.css';

const EXAMPLE_JSON = JSON.stringify({
  textSize: { type: 'number', value: 5, label: 'Text Size' },
  duration: { type: 'slider', value: 5, min: 1, max: 30, step: 1, label: 'Duration' },
  fontColor: { type: 'colorpicker', value: 'rgb(255, 255, 255)', label: 'Font Color' },
  wiggle: { type: 'checkbox', value: true, label: 'Enable Wiggle' },
  fontFamily: { type: 'googleFont', value: 'Roboto', label: 'Font Family' },
  alertSound: { type: 'sound-input', value: '', label: 'Alert Sound' },
  theme: { type: 'dropdown', value: 'default', label: 'Theme', options: { default: 'Default', minimal: 'Minimal' } },
}, null, 2);

const input = document.getElementById('json-input');
const output = document.getElementById('code-output');
const messages = document.getElementById('messages');
const btnExample = document.getElementById('btn-example');
const btnCopy = document.getElementById('btn-copy');

let rawCode = '';

function render() {
  const result = generate(input.value);

  // Clear messages
  messages.innerHTML = '';
  messages.className = 'messages';

  if (result.empty) {
    output.textContent = '// Paste a StreamElements widget JSON config on the left';
    output.removeAttribute('data-highlighted');
    highlight(output.textContent, output);
    rawCode = '';
    return;
  }

  if (result.error) {
    messages.className = 'messages error';
    messages.textContent = `Error: ${result.error}`;
    output.textContent = '';
    rawCode = '';
    return;
  }

  if (result.warnings.length > 0) {
    messages.className = 'messages warning';
    messages.innerHTML = result.warnings.map(w => `<div>${w}</div>`).join('');
  }

  rawCode = result.code;
  output.removeAttribute('data-highlighted');
  highlight(result.code, output);
}

// Debounce
let timer;
function onInput() {
  clearTimeout(timer);
  timer = setTimeout(render, 300);
}

input.addEventListener('input', onInput);

btnExample.addEventListener('click', () => {
  input.value = EXAMPLE_JSON;
  render();
});

btnCopy.addEventListener('click', async () => {
  if (!rawCode) return;
  try {
    await navigator.clipboard.writeText(rawCode);
    btnCopy.textContent = 'Copied!';
    btnCopy.classList.add('copied');
    setTimeout(() => {
      btnCopy.textContent = 'Copy';
      btnCopy.classList.remove('copied');
    }, 1500);
  } catch {
    // Fallback
    const ta = document.createElement('textarea');
    ta.value = rawCode;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    btnCopy.textContent = 'Copied!';
    setTimeout(() => { btnCopy.textContent = 'Copy'; }, 1500);
  }
});

// Initial render
render();
