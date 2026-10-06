import { mkdir, readFile, unlink, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const ROOT = process.env.STORAGE_DIR || path.join(process.cwd(), "storage");

function storedPath(key: string) {
  return path.join(/*turbopackIgnore: true*/ ROOT, key);
}

export async function saveFile(data: Buffer, originalName: string) {
  const safeName = originalName.replace(/[^A-Za-z0-9._-]/g, "_").slice(0, 120);
  const key = `${randomUUID()}-${safeName}`;
  await mkdir(ROOT, { recursive: true });
  await writeFile(storedPath(key), data);
  return key;
}

export function readStoredFile(key: string) {
  return readFile(storedPath(key));
}

export async function deleteStoredFile(key: string) {
  await unlink(storedPath(key)).catch(() => undefined);
}
