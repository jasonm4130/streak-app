import { db } from '../db';
import type { DayLog, Photo, Settings } from '../types';
import { blobToDataUrl, dataUrlToBlob } from './photos';

export const SCHEMA_VERSION = 1;

interface ExportPhoto {
  id: string;
  takenAt: string;
  dataUrl: string;
}

export interface StreakExport {
  schema: number;
  exportedAt: string;
  settings: Settings | null;
  days: DayLog[];
  photos: ExportPhoto[];
}

export async function exportAll(): Promise<StreakExport> {
  const settings = (await db.settings.get('singleton')) ?? null;
  const days = await db.days.toArray();
  const photos = await db.photos.toArray();
  const exportPhotos: ExportPhoto[] = await Promise.all(
    photos.map(async (p) => ({
      id: p.id,
      takenAt: p.takenAt,
      dataUrl: await blobToDataUrl(p.blob),
    })),
  );
  return {
    schema: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    settings,
    days,
    photos: exportPhotos,
  };
}

interface ImportOptions {
  wipe: boolean;
}

export async function importAll(dump: StreakExport, opts: ImportOptions): Promise<void> {
  if (dump.schema !== SCHEMA_VERSION) {
    throw new Error(`unsupported schema version: ${dump.schema}`);
  }

  await db.transaction('rw', db.days, db.photos, db.settings, async () => {
    if (opts.wipe) {
      await db.days.clear();
      await db.photos.clear();
      await db.settings.clear();
    }

    if (dump.settings) {
      await db.settings.put(dump.settings);
    }

    for (const incoming of dump.days) {
      const local = await db.days.get(incoming.date);
      const localTs = local?.updatedAt ?? 0;
      const incomingTs = incoming.updatedAt ?? 0;
      if (!local || incomingTs >= localTs) {
        await db.days.put(incoming);
      }
    }

    for (const p of dump.photos) {
      const blob = await dataUrlToBlob(p.dataUrl);
      const photo: Photo = { id: p.id, takenAt: p.takenAt, blob };
      await db.photos.put(photo);
    }
  });
}
