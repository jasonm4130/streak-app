import { describe, expect, it } from 'vitest';
import { blobToDataUrl, dataUrlToBlob } from '../src/lib/photos';

describe('photos round-trip', () => {
  it('base64 round-trips a small blob', async () => {
    const original = new Blob(['hello'], { type: 'text/plain' });
    const url = await blobToDataUrl(original);
    expect(url.startsWith('data:text/plain;base64,')).toBe(true);
    const back = await dataUrlToBlob(url);
    expect(back.type).toBe('text/plain');
    expect(await back.text()).toBe('hello');
  });
});
