import { Documentation } from 'express-zod-api';
import { config } from './config.js';
import { routing } from './routing.js';
import * as fs from 'fs/promises';
import * as path from 'path';

const yml = new Documentation({
  routing,
  config,
  version: '1',
  title: 'Tripify',
  serverUrl: 'https://tripify.io',
  composition: 'inline',
}).getSpecAsYaml();

await fs.writeFile(path.join(import.meta.dirname, `metadata/spec.yml`), yml);
