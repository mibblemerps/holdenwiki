import env from './env.js';
import Index from './docs/index.js';

console.log('Begin index...');
const index = new Index(env.DOCS_ROOT);
index.indexDirectory();
console.log('Done');

