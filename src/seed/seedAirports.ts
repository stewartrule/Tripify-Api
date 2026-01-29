import type { Selectable } from 'kysely';
import { db } from '../db/index.js';
import { Country } from '../db/generated.js';
import { NewAirport } from '../db/types.js';
import { airportData } from './scraped/airportData.js';

export async function seedAirports(
  countries: Selectable<Country>[]
): Promise<
  { id: number; country_id: number; latitude: number; longitude: number }[]
> {
  const values: NewAirport[] = airportData
    .map((data) => {
      const country = countries.find(
        (country) => data.country === country.name
      );
      if (country && typeof data.coordinates === 'object') {
        const value: NewAirport = {
          country_id: country.id,
          latitude: data.coordinates.latitude,
          longitude: data.coordinates.longitude,
          name: data.airport,
          iata: data.iata,
          icao: data.icao,
          lanes: data.lanes,
        };
        return value;
      }
      return null;
    })
    .filter((it) => it != null);

  const rows = await db
    .insertInto('airport')
    .values(values)
    .returning(['id', 'country_id', 'airport.latitude', 'airport.longitude'])
    .execute();

  return rows;
}
