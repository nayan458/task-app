import { join, resolve } from 'path';
import { existsSync } from 'fs';

function findProtoDir(): string {
  const candidates = [
    resolve(process.cwd(), 'libs/proto/src/proto'),
    resolve(__dirname, '..', 'proto'),
    resolve(__dirname, 'proto'),
  ];
  for (const dir of candidates) {
    if (existsSync(join(dir, 'auth.proto'))) return dir;
  }
  throw new Error(
    `Could not locate proto directory. Searched: ${candidates.join(', ')}`,
  );
}

export const PROTO_DIR = findProtoDir();

export const AUTH_PACKAGE = 'auth';
export const TASK_PACKAGE = 'task';

export const AUTH_SERVICE = 'AUTH_SERVICE';
export const TASK_SERVICE = 'TASK_SERVICE';

export const AUTH_PROTO_PATH = join(PROTO_DIR, 'auth.proto');
export const TASK_PROTO_PATH = join(PROTO_DIR, 'task.proto');
