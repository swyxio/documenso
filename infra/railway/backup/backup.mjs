import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createGzip } from 'node:zlib';
import { S3Client, ListObjectsV2Command, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';

function client(prefix) {
  return new S3Client({ endpoint: process.env[`${prefix}_ENDPOINT`], region: 'auto', credentials: {
    accessKeyId: process.env[`${prefix}_ACCESS_KEY_ID`], secretAccessKey: process.env[`${prefix}_SECRET_ACCESS_KEY`],
  }});
}
const documents = client('DOCUMENTS');
const backups = client('BACKUPS');
const snapshot = `snapshots/${new Date().toISOString()}`;
const manifest = { createdAt: new Date().toISOString(), objects: [] };
const hash = (buffer) => createHash('sha256').update(buffer).digest('hex');
async function store(key, body) {
  await backups.send(new PutObjectCommand({ Bucket: process.env.BACKUPS_BUCKET, Key: `${snapshot}/${key}`, Body: body }));
  return { key, size: body.length, sha256: hash(body) };
}
const database = new URL(process.env.DATABASE_URL);
const dump = spawn('pg_dump', ['--no-owner', '--no-acl'], { env: { ...process.env, PGHOST: database.hostname, PGPORT: database.port || '5432', PGUSER: decodeURIComponent(database.username), PGPASSWORD: decodeURIComponent(database.password), PGDATABASE: database.pathname.slice(1), PGSSLMODE: database.searchParams.get('sslmode') || 'prefer' }, stdio: ['ignore', 'pipe', 'pipe'] });
dump.stderr.resume();
const completed = new Promise((resolve, reject) => {
  dump.on('error', reject);
  dump.on('exit', (code) => code === 0 ? resolve() : reject(new Error(`Database dump failed (${code})`)));
});
// A compressed dump is collected before upload; the small team instance has a 1GB backup limit.
const chunks = [];
let total = 0;
for await (const chunk of dump.stdout.pipe(createGzip())) {
  total += chunk.length;
  if (total > 1024 ** 3) { dump.kill(); throw new Error('Database backup exceeds 1GB'); }
  chunks.push(chunk);
}
await completed;
manifest.database = await store('database.sql.gz', Buffer.concat(chunks));
let token;
do {
  const page = await documents.send(new ListObjectsV2Command({ Bucket: process.env.DOCUMENTS_BUCKET, ContinuationToken: token }));
  for (const object of page.Contents ?? []) {
    const response = await documents.send(new GetObjectCommand({ Bucket: process.env.DOCUMENTS_BUCKET, Key: object.Key }));
    const body = await response.Body.transformToByteArray();
    manifest.objects.push({ sourceKey: object.Key, ...await store(`documents/${object.Key}`, body) });
  }
  token = page.NextContinuationToken;
} while (token);
// Written last: only manifests represent complete snapshots.
await store('manifest.json', Buffer.from(JSON.stringify(manifest, null, 2)));
console.log(JSON.stringify({ snapshot, documents: manifest.objects.length, databaseBytes: manifest.database.size, complete: true }));
