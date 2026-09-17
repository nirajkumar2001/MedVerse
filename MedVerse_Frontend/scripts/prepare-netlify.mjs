import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('..', import.meta.url));
const dist = join(root, 'dist');

for (const [source, target] of [
  ['healthcare-app/browser', 'healthcare'],
  ['learning-app/browser', 'learning'],
  ['auth-admin/browser', 'admin']
]) {
  const targetPath = join(dist, target);
  await rm(targetPath, { recursive: true, force: true });
  await mkdir(targetPath, { recursive: true });
  await cp(join(dist, source), targetPath, { recursive: true });
}

if (process.env.MEDVERSE_API_ORIGIN) {
  const apiOrigin = process.env.MEDVERSE_API_ORIGIN.replace(/\/$/, '');
  await writeFile(
    join(dist, '_redirects'),
    `/api/* ${apiOrigin}/api/:splat 200!\n/ws/* ${apiOrigin}/ws/:splat 200!\n`
  );
}
