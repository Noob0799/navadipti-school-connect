import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";

const endpoint = process.env.S3_ENDPOINT;
const region = process.env.S3_REGION || "auto";
const accessKeyId = process.env.S3_ACCESS_KEY_ID;
const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
const bucket = process.env.S3_BUCKET_NAME;

function client() {
  if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error("Object storage is not configured. Set S3_ENDPOINT, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY and S3_BUCKET_NAME.");
  }
  return new S3Client({
    region,
    endpoint,
    forcePathStyle: true,
    credentials: { accessKeyId, secretAccessKey },
  });
}

export async function saveFile(data: Buffer, originalName: string) {
  const safeName = originalName.replace(/[^A-Za-z0-9._-]/g, "_").slice(0, 120);
  const key = `${randomUUID()}-${safeName}`;
  await client().send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: data }));
  return key;
}

export async function readStoredFile(key: string) {
  const result = await client().send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  const bytes = await result.Body!.transformToByteArray();
  return Buffer.from(bytes);
}

export async function deleteStoredFile(key: string) {
  await client().send(new DeleteObjectCommand({ Bucket: bucket, Key: key })).catch(() => undefined);
}
