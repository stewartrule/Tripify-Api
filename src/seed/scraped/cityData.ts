import { cityDataAB } from './cityDataAB.js';
import { cityDataCDEF } from './cityDataCDEF.js';
import { cityDataGHIJK } from './cityDataGHIJK.js';
import { cityDataLMNO } from './cityDataLMNO.js';
import { cityDataPQRS } from './cityDataPQRS.js';
import { cityDataTUVWYZ } from './cityDataTUVWYZ.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';

export type Data = {
  city: string;
  province: string;
  population: number;
  country: string;
  cityUrl: string;
  coordinates:
    | {
        latitude: number;
        longitude: number;
      }
    | number;
};

type Data2 = {
  city: string;
  province: string;
  population: number;
  country: string;
  cityUrl: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
};

export const cityData: Data2[] = cityDataAB
  .concat(cityDataCDEF)
  .concat(cityDataGHIJK)
  .concat(cityDataLMNO)
  .concat(cityDataPQRS)
  .concat(cityDataTUVWYZ)
  .filter((data): data is Data2 => typeof data.coordinates === 'object');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

fs.writeFile(
  path.join(__dirname, 'cities.json'),
  JSON.stringify(cityData, null, ' ')
);
