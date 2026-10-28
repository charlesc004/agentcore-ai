import {cpSync, existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
process.chdir(root);
if (!existsSync('.next/standalone/server.js')) {
  throw new Error('Run npm run build before starting the production server.');
}
cpSync('.next/static', '.next/standalone/.next/static', {recursive:true});
if (existsSync('public')) cpSync('public', '.next/standalone/public', {recursive:true});
process.env.HOSTNAME ||= '127.0.0.1';
await import('../.next/standalone/server.js');
