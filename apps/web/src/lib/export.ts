import { db } from '../db';
import type { DayLog, Photo, Settings } from '../types';
import { blobToDataUrl, dataUrlToBlob } from './photos';

/**
 * Versioned dump format. Bumped on breaking schema changes; `importAll` will
 * reject dumps whose version doesn't match the current one rather than try
 * to migrate them in-flight.
 */
const SCHEMA_VERSION = 1;

interface ExportPhoto {
  id: string;
  takenAt: string;
  dataUrl: string;
}

/** Self-contained backup payload: settings + all days + all photos (as data URLs). */
export interface StreakExport {
  schema: number;
  exportedAt: string;
  settings: Settings | null;
  days: DayLog[];
  photos: ExportPhoto[];
}

/** Dump the full Dexie database to a JSON-serialisable object. Photos are inlined as data URLs. */
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

/**
 * Import a dump back into the database.
 *
 * Merge semantics for days: newer `updatedAt` wins per-date. A missing
 * `updatedAt` is treated as 0, so a dump row will overwrite a local row
 * with no timestamp but not one with any timestamp. Settings and photos
 * are unconditional `put`s. With `opts.wipe`, all tables are cleared first
 * so the import is an exact restore rather than a merge.
 */
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
