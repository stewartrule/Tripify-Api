import { cityDataAB } from './cityDataAB';
import { cityDataCDEF } from './cityDataCDEF';
import { cityDataGHIJK } from './cityDataGHIJK';
import { cityDataLMNO } from './cityDataLMNO';
import { cityDataPQRS } from './cityDataPQRS';
import { cityDataTUVWYZ } from './cityDataTUVWYZ';
import * as fs from 'fs/promises';
import * as path from 'path';

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

fs.writeFile(
  path.join(__dirname, 'cities.json'),
  JSON.stringify(cityData, null, ' ')
);
