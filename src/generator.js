const SKIP_TYPES = new Set(['button', 'hidden']);

const NUMERIC_TYPES = new Set(['number', 'slider']);

const BOOLEAN_TYPES = new Set(['checkbox']);

// JS reserved words that cannot be used as bare identifiers
const RESERVED = new Set([
  'break','case','catch','continue','debugger','default','delete','do','else',
  'finally','for','function','if','in','instanceof','new','return','switch',
  'this','throw','try','typeof','var','void','while','with','class','const',
  'enum','export','extends','import','super','implements','interface','let',
  'package','private','protected','public','static','yield',
]);

function needsBracketNotation(name) {
  return !/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name) || RESERVED.has(name);
}

function fieldAccess(obj, name) {
  if (needsBracketNotation(name)) {
    return `${obj}["${name}"]`;
  }
  return `${obj}.${name}`;
}

function classifyField(field) {
  const type = (field.type || '').toLowerCase();
  if (SKIP_TYPES.has(type)) return 'skip';
  if (NUMERIC_TYPES.has(type)) return 'numeric';
  if (BOOLEAN_TYPES.has(type)) return 'boolean';
  return 'string';
}

function getDefault(category, field) {
  if (field.value !== undefined && field.value !== null) {
    if (category === 'boolean') {
      return field.value === 'yes' || field.value === true;
    }
    if (category === 'numeric') {
      const n = Number(field.value);
      return isNaN(n) ? 0 : n;
    }
    return field.value;
  }
  if (category === 'numeric') return 0;
  if (category === 'boolean') return true;
  return '';
}

function formatValue(val) {
  if (typeof val === 'boolean') return String(val);
  if (typeof val === 'number') return String(val);
  return JSON.stringify(String(val));
}

/**
 * @param {string} jsonStr
 * @returns {{ code: string, warnings: string[] }}
 */
export function generate(jsonStr) {
  const warnings = [];

  const trimmed = jsonStr.trim();
  if (!trimmed) {
    return { code: '', warnings: [], empty: true };
  }

  let config;
  try {
    config = JSON.parse(trimmed);
  } catch (err) {
    return { code: '', warnings: [], error: err.message };
  }

  if (typeof config !== 'object' || config === null || Array.isArray(config)) {
    return { code: '', warnings: [], error: 'Expected a JSON object at root level' };
  }

  const entries = Object.entries(config);
  if (entries.length === 0) {
    return { code: '// No fields found', warnings: [] };
  }

  const fields = []; // { name, category, defaultVal }

  for (const [name, value] of entries) {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      warnings.push(`Skipped "${name}": value is not an object`);
      continue;
    }

    if (!value.type) {
      warnings.push(`"${name}" has no type — treated as text`);
      value.type = 'text';
    }

    const category = classifyField(value);
    if (category === 'skip') continue;

    fields.push({
      name,
      category,
      defaultVal: getDefault(category, value),
    });
  }

  if (fields.length === 0) {
    return { code: '// No fields found', warnings };
  }

  // Block 1: variable declarations
  const declarations = fields.map((f, i) => {
    const prefix = i === 0 ? 'let ' : '    ';
    const suffix = i < fields.length - 1 ? ',' : ';';
    const varName = needsBracketNotation(f.name) ? `_${f.name.replace(/[^a-zA-Z0-9_$]/g, '_')}` : f.name;
    f.varName = varName;
    return `${prefix}${varName} = ${formatValue(f.defaultVal)}${suffix}`;
  });

  // Block 2: onEventReceived (static boilerplate)
  const onEvent = [
    "window.addEventListener('onEventReceived', function (obj) {",
    '    if (!obj.detail.event) {',
    '      return;',
    '    }',
    '});',
  ];

  // Block 3: onWidgetLoad (dynamic)
  const onLoad = [
    "window.addEventListener('onWidgetLoad', function (obj) {",
    '    let recents = obj.detail.recents;',
    '    recents.sort(function (a, b) {',
    '        return Date.parse(a.createdAt) - Date.parse(b.createdAt);',
    '    });',
    '    const fieldData = obj.detail.fieldData;',
  ];

  for (const f of fields) {
    const access = fieldAccess('fieldData', f.name);
    if (f.category === 'boolean') {
      onLoad.push(`    ${f.varName} = (${access} === "yes");`);
    } else {
      onLoad.push(`    ${f.varName} = ${access};`);
    }
  }

  onLoad.push('});');

  const code = [...declarations, '', ...onEvent, '', ...onLoad].join('\n');

  return { code, warnings };
}
