import fs from 'node:fs';
import { inflateRawSync } from 'node:zlib';
import { unzipSync } from 'fflate';
import { decompress } from 'fzstd';
import { decodeBinarySchema, compileSchema } from 'kiwi-schema';

const archive = unzipSync(fs.readFileSync('tramporapido.fig'));
const buffer = Buffer.from(archive['canvas.fig']);
if (buffer.toString('utf8', 0, 8) !== 'fig-kiwi') throw new Error('Formato inesperado');
let offset = 12;
const chunks = [];
while (offset + 4 <= buffer.length) {
  const size = buffer.readUInt32LE(offset); offset += 4;
  const chunk = buffer.subarray(offset, offset + size); offset += size;
  chunks.push(chunk.readUInt32LE(0) === 0xfd2fb528 ? decompress(chunk) : inflateRawSync(chunk));
}
const schema = decodeBinarySchema(chunks[0]);
const message = compileSchema(schema).decodeMessage(chunks[1]);
fs.mkdirSync('design-reference/local', { recursive: true });
fs.writeFileSync('design-reference/local/document.json', JSON.stringify(message, (_, v) => v instanceof Uint8Array ? Array.from(v) : v));
fs.writeFileSync('design-reference/local/schema.json', JSON.stringify(schema));
for (const name of ['meta.json', 'thumbnail.png']) if (archive[name]) fs.writeFileSync('design-reference/local/' + name, archive[name]);
console.log(JSON.stringify({ files: Object.keys(archive), keys: Object.keys(message), nodes: message.nodeChanges?.length }));
