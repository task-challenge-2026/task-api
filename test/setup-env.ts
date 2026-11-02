import { readFileSync } from 'fs';
import path from 'path';
import { parseEnv } from 'util';

const envFile = readFileSync(path.resolve(__dirname, '../.env.test'), 'utf8');
Object.assign(process.env, parseEnv(envFile));
