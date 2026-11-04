// Provenance text for code-generated icons and screenshots; no image generation service.
const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
export const originKey = 'impeccable:prompt';
function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
export function withOrigin(png, origin) {
  if (!png.subarray(0, 8).equals(signature) || !/^[\x20-\x7e]+$/.test(origin)) throw new Error('PNG or ASCII origin invalid');
  const chunks = [signature];
  let foundEnd = false;
  for (let offset = 8; offset < png.length;) {
    const length = png.readUInt32BE(offset);
    const end = offset + length + 12;
    if (end > png.length) throw new Error('Truncated PNG');
    const type = png.toString('ascii', offset + 4, offset + 8);
    const data = png.subarray(offset + 8, end - 4);
    if (type === 'IEND') {
      const text = Buffer.from(`${originKey}\0${origin}`, 'latin1');
      const chunk = Buffer.alloc(text.length + 12);
      chunk.writeUInt32BE(text.length, 0); chunk.write('tEXt', 4, 'ascii'); text.copy(chunk, 8);
      chunk.writeUInt32BE(crc32(chunk.subarray(4, -4)), chunk.length - 4);
      chunks.push(chunk); foundEnd = true;
    }
    if (!(type === 'tEXt' && data.subarray(0, originKey.length + 1).equals(Buffer.from(`${originKey}\0`)))) chunks.push(png.subarray(offset, end));
    offset = end;
  }
  if (!foundEnd) throw new Error('PNG without IEND');
  return Buffer.concat(chunks);
}
