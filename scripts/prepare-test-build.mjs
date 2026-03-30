import { cp, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('.test-build/src');

await duplicateExtensionless(root);

async function duplicateExtensionless(directory) {
  const entries = await readdir(directory);

  await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(directory, entry);
      const info = await stat(fullPath);

      if (info.isDirectory()) {
        await duplicateExtensionless(fullPath);
        return;
      }

      if (!entry.endsWith('.js')) return;
      await cp(fullPath, fullPath.slice(0, -3));
    }),
  );
}
