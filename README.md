# SE Widget Helper

A web tool that generates JavaScript boilerplate for [StreamElements](https://streamelements.com/) custom widgets from their JSON field configuration.

Paste the `fields` JSON object from the StreamElements widget editor and get ready-to-use JS code with variable declarations, `onWidgetLoad`, and `onEventReceived` listeners.

## Features

- Real-time code generation as you type
- Syntax-highlighted output (highlight.js)
- One-click copy to clipboard
- Handles all SE field types: `number`, `slider`, `checkbox`, `colorpicker`, `googleFont`, `sound-input`, `dropdown`, and more
- Loads with an example JSON so you can see it working immediately

## Getting Started

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Stack

- [Vite](https://vitejs.dev/)
- [highlight.js](https://highlightjs.org/) (JavaScript syntax highlighting)
- Vanilla JS, HTML, CSS
