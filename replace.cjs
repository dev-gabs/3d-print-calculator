const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('src');

const replacements = {
  'bg-\\[#F6F6F3\\]': 'bg-canvas',
  'bg-white': 'bg-surface',
  'text-\\[#171A18\\]': 'text-txt',
  'border-\\[#E3E6E2\\]': 'border-border',
  'divide-\\[#E3E6E2\\]': 'divide-border',
  'bg-\\[#E3E6E2\\]': 'bg-border',
  'text-\\[#707570\\]': 'text-txt-muted',
  'bg-\\[#2F6B4A\\]': 'bg-brand',
  'text-\\[#2F6B4A\\]': 'text-brand',
  'border-\\[#2F6B4A\\]': 'border-brand',
  'ring-\\[#2F6B4A\\]': 'ring-brand',
  'hover:bg-\\[#26573C\\]': 'hover:bg-brand-hover',
  'hover:text-\\[#26573C\\]': 'hover:text-brand-hover',
  'hover:border-\\[#D0D4CF\\]': 'hover:border-border-subtle',
  'bg-\\[#EAF3ED\\]': 'bg-brand-light',
  'border-\\[#D0D4CF\\]': 'border-border-subtle',
  'text-\\[#26573C\\]': 'text-brand-hover'
};

files.forEach((file) => {
  let content = fs.readFileSync(file, 'utf8');
  let modified = false;
  for (const [pattern, replacement] of Object.entries(replacements)) {
    const regex = new RegExp(pattern, 'g');
    if (regex.test(content)) {
      content = content.replace(regex, replacement);
      modified = true;
    }
  }
  if (modified) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated', file);
  }
});
