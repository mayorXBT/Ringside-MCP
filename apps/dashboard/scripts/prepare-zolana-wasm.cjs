const { readdirSync, copyFileSync, existsSync } = require('node:fs');
const { join, resolve } = require('node:path');

const modules = resolve(__dirname, '../../../node_modules/.pnpm');
const entry = readdirSync(modules).find(name => name.startsWith('@lightprotocol+hasher.rs@0.2.1'));
if (!entry) throw new Error('Pinned @lightprotocol/hasher.rs 0.2.1 is missing');
const dist = join(modules, entry, 'node_modules/@lightprotocol/hasher.rs/dist');
for (const file of ['hasher_wasm_simd_bg.wasm', 'light_wasm_hasher_bg.wasm']) {
  const source = join(dist, file);
  const target = join(dist, 'browser-fat/es', file);
  if (!existsSync(source)) throw new Error(`Zolana browser WASM missing: ${file}`);
  copyFileSync(source, target);
}
