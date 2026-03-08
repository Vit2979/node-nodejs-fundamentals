import { promises as fs } from 'fs';
import path from 'path';

const snapshot = async () => {
  const workspacePath = path.resolve('workspace');
  const snapshotPath = path.resolve('snapshot.json');

  let stats;
  try {
    stats = await fs.stat(workspacePath);
  } catch {
    throw new Error('FS operation failed');
  }

  if (!stats.isDirectory()) {
    throw new Error('FS operation failed');
  }

  const entries = [];

  const scanDirectory = async (dir) => {
    const items = await fs.readdir(dir, { withFileTypes: true });

    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      const relativePath = path.relative(workspacePath, fullPath);

      if (item.isDirectory()) {
        entries.push({
          path: relativePath,
          type: 'directory'
        });

        await scanDirectory(fullPath);
      }

      if (item.isFile()) {
        const buffer = await fs.readFile(fullPath);

        entries.push({
          path: relativePath,
          type: 'file',
          size: buffer.length,
          content: buffer.toString('base64')
        });
      }
    }
  };

  await scanDirectory(workspacePath);

  const result = {
    rootPath: workspacePath,
    entries
  };

  await fs.writeFile(snapshotPath, JSON.stringify(result, null, 2));
};

await snapshot();