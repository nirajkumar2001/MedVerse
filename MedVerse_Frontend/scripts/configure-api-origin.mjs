import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const configPath = join(scriptDirectory, '..', 'projects', 'shared-services', 'src', 'lib', 'api-config.ts');
const apiOrigin = (process.env.MEDVERSE_API_ORIGIN || '').replace(/\/$/, '');

await writeFile(configPath, `export const API_ORIGIN = '${apiOrigin}';\nexport const API_BASE_URL = \`${'${API_ORIGIN}'}/api/v1\`;\n\nexport const apiUrl = (path: string): string => {\n  const normalizedPath = path.startsWith('/') ? path : \`/\${path}\`;\n  return \`${'${API_BASE_URL}'}\${normalizedPath}\`;\n};\n`);
