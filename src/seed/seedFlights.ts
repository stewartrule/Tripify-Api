import { faker } from '@faker-js/faker';
import type { Selectable } from 'kysely';
import { db } from '../db';
import { Country } from '../db/generated';
import { NewFlight } from '../db/types';
import { getDistanceFromLatLonInKm } from '../util/getDistanceFromLatLonInKm';
import { airlineData } from './scraped/airlineData';
import { airplaneData } from './scraped/airplaneData';

export async function seedFlights(
  airportIds: {
    id: number;
    country_id: number;
    latitude: number;
    longitude: number;
  }[],
  countries: Selectable<Country>[]
): Promise<{ id: number }[]> {
  const airplanes = await db
    .insertInto('airplane')
    .values(
      airplaneData.map((data) => ({
        name: data.type,
      }))
    )
    .returning('id')
    .execute();

  const airlineValues = airlineData
    .map((data) => ({
      name: data.name,
      logo_src: `/images/airline/${data.file}`,
      country_id:
        countries.find((country) => data.country == country.name)?.id || -1,
    }))
    .filter((it) => it.country_id > 0);

  console.log('airlineData.length', airlineData.length);
  console.log('airlineValues.length', airlineValues.length);

  const airlines = await db
    .insertInto('airline')
    .values(airlineValues)
    .returning(['id', 'country_id'])
    .execute();

  const today = new Date();
  const max = faker.date.soon({ days: 14, refDate: today });

  const flightValues: NewFlight[] = airportIds
    .flatMap(({ id, country_id, latitude, longitude }): NewFlight[] => {
      const otherAirports = airportIds.filter(
        (it) => it.country_id !== country_id
      );
      const arrivalAirports = faker.helpers.arrayElements(otherAirports, 8);
      const airplane = faker.helpers.arrayElement(airplanes);

      const airlinesInCountry = airlines.filter(
        (it) => it.country_id === country_id
      );

      const airline =
        airlinesInCountry.length > 0
          ? faker.helpers.arrayElement(airlinesInCountry)
          : faker.helpers.arrayElement(airlines);

      return arrivalAirports.map((arrivalAirport): NewFlight => {
        const distanceInKm = getDistanceFromLatLonInKm(
          latitude,
          longitude,
          arrivalAirport.latitude,
          arrivalAirport.longitude
        );
        // 1h = 770 - 930 km/u
        const duration = distanceInKm / 770;

        const fromDate = faker.date.between({ from: today, to: max });
        let toDate = new Date(fromDate.getTime());
        toDate.setTime(
          toDate.getTime() + Math.round(duration * 60 * 60 * 1000)
        );

        const value: NewFlight = {
          airline_id: airline.id,
          airplane_id: airplane.id,

          // Departure.
          departure_airport_id: id,
          planned_departure_at: fromDate,
          departure_at: fromDate,
          departure_gate: gate(),

          // Arrival.
          arrival_airport_id: arrivalAirport.id,
          planned_arrival_at: toDate,
          arrival_at: toDate,
          arrival_gate: gate(),
        };
        return value;
      });
    })
    .filter((it) => it != null);

  const flights = await db
    .insertInto('flight')
    .values(flightValues)
    .returning('id')
    .execute();
  return flights;
}

function gate() {
  const chars = ['A', 'B', 'C', 'D', 'E', 'F'];
  const num = faker.number.int({ min: 1, max: 56 });
  const char = faker.helpers.arrayElement(chars);
  return `${char}${num}`;
}
