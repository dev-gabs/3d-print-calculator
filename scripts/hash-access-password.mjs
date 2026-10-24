// Gera o hash da senha de acesso da 3D Price.
// Uso: node scripts/hash-access-password.mjs "3DPRICE-XXXX-XXXX"
// Cole o resultado em ACCESS_PASSWORD_HASH (src/config/access.ts).
import { createHash } from 'node:crypto';

const input = process.argv[2];
if (!input) {
  console.error('Uso: node scripts/hash-access-password.mjs "SUA-SENHA"');
  process.exit(1);
}

const normalized = input.toUpperCase().replace(/[^A-Z0-9]/g, '');
const hash = createHash('sha256').update(normalized).digest('hex');

console.log(`Senha normalizada: ${normalized}`);
console.log(`Hash: ${hash}`);
