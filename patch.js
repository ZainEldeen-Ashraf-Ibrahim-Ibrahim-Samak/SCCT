/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const files = ['dist/index.js', 'dist/index.mjs', 'dist/index.cjs'];
files.forEach(f => {
  const p = 'node_modules/next-themes/' + f;
  if (!fs.existsSync(p)) return;
  let c = fs.readFileSync(p, 'utf8');
  c = c.replace(/\/\*#__PURE__\*\/return ([a-zA-Z0-9_\.]+)\.createElement\("script"/g, '/*#__PURE__*/return typeof window!=="undefined"?null:$1.createElement("script"');
  fs.writeFileSync(p, c);
});
