import type { Selectable } from 'kysely';
import { db } from '../db/index.js';
import { City, Country } from '../db/generated.js';
import { NewCity } from '../db/types.js';
import { cityData } from './scraped/cityData.js';

export async function seedCities(
  countries: Selectable<Country>[]
): Promise<Selectable<City>[]> {
  let allCities: Selectable<City>[] = [];

  for (const country of countries) {
    const rawCities = cityData.filter((city) => city.country === country.name);
    const provinceNames = Array.from(
      new Set(rawCities.map((city) => city.province))
    );

    if (provinceNames.length > 0) {
      const provinces = await db
        .insertInto('province')
        .values(
          provinceNames.map((name) => ({
            name,
            country_id: country.id,
          }))
        )
        .returningAll()
        .execute();

      console.log(`inserted provinces for ${country.name}`);

      const newCities: NewCity[] = rawCities.flatMap((rawCity) => {
        return provinces
          .filter((province) => province.name == rawCity.province)
          .map((province) => ({
            name: rawCity.city,
            latitude: rawCity.coordinates.latitude,
            longitude: rawCity.coordinates.longitude,
            province_id: province.id,
          }));
      });

      const cities = await db
        .insertInto('city')
        .values(newCities)
        .returningAll()
        .execute();

      console.log(`inserted cities for ${country.name}`);

      allCities = allCities.concat(cities);
    }
  }

  return allCities;
}
