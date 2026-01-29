import { faker } from '@faker-js/faker';
import type { Selectable } from 'kysely';
import { Country } from '../db/generated.js';
import { db } from '../db/index.js';
import {
  NewAirplaneSeat,
  NewFlight,
  NewGate,
  NewPassenger,
} from '../db/types.js';
import { toSqlUtc } from '../util/date.js';
import { getDistanceFromLatLonInKm } from '../util/getDistanceFromLatLonInKm.js';
import { airlineData } from './scraped/airlineData.js';
import { airplaneData } from './scraped/airplaneData.js';

export async function seedFlights(
  airportIds: {
    id: number;
    country_id: number;
    latitude: number;
    longitude: number;
  }[],
  countries: Selectable<Country>[]
): Promise<{ id: number }[]> {
  const paymentMethods = await db
    .insertInto('payment_method')
    .values(
      ['stripe', 'ideal', 'mastercard'].map((name) => ({
        name,
      }))
    )
    .returning(['id'])
    .execute();

  const airplanes = await db
    .insertInto('airplane')
    .values(
      airplaneData.map((data) => ({
        name: data.type,
        has_entertainment: faker.datatype.boolean(),
        has_usb: faker.datatype.boolean(),
        has_wifi: faker.datatype.boolean(),
      }))
    )
    .returning('id')
    .execute();

  const airplaneSeatValues = airplanes.flatMap((airplane) => {
    const seatTypes = ['first', 'business', 'economy'] as const;
    const seats: NewAirplaneSeat[] = [];
    let row = 1;
    for (const seatType of seatTypes) {
      for (let i = 0; i < 20; i++) {
        for (const seat of ['a', 'b', 'c', 'd', 'e', 'f']) {
          seats.push({
            airplane_id: airplane.id,
            row: row,
            type: seatType,
            seat,
            bulkhead: i === 0,
            exit_row: i === 9,
          });
        }
        row++;
      }
    }
    return seats;
  });

  const airplaneSeats = await db
    .insertInto('airplane_seat')
    .values(airplaneSeatValues)
    .returning(['id', 'airplane_id'])
    .execute();

  console.log('airplaneSeats.length', airplaneSeats.length);

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

  const gateValues = airportIds.flatMap(({ id }) =>
    ['a', 'b', 'c', 'd'].flatMap((terminal) =>
      [1, 2, 3, 4].map(
        (gate): NewGate => ({
          airport_id: id,
          terminal,
          gate,
        })
      )
    )
  );

  const gates = await db
    .insertInto('gate')
    .values(gateValues)
    .returning(['id', 'airport_id'])
    .execute();

  const flightValues: NewFlight[] = airportIds
    .flatMap(({ id, country_id, latitude, longitude }): NewFlight[] => {
      const otherAirports = airportIds.filter(
        (it) => it.country_id !== country_id
      );
      const arrivalAirports = faker.helpers.arrayElements(otherAirports, 6);
      const airplane = faker.helpers.arrayElement(airplanes);

      const airlinesInCountry = airlines.filter(
        (it) => it.country_id === country_id
      );

      const airline =
        airlinesInCountry.length > 0
          ? faker.helpers.arrayElement(airlinesInCountry)
          : faker.helpers.arrayElement(airlines);

      const departureGates = gates.filter((gate) => gate.airport_id === id);

      return arrivalAirports.map((arrivalAirport): NewFlight => {
        const distanceInKm = getDistanceFromLatLonInKm(
          latitude,
          longitude,
          arrivalAirport.latitude,
          arrivalAirport.longitude
        );
        // 1h ~= 770 - 930 km/u
        const duration = distanceInKm / 770;

        const fromDate = faker.date.between({ from: today, to: max });
        let toDate = new Date(fromDate.getTime());
        toDate.setTime(
          toDate.getTime() + Math.round(duration * 60 * 60 * 1000)
        );

        const arrivalGates = gates.filter(
          (gate) => gate.airport_id === arrivalAirport.id
        );
        const departureGate = faker.helpers.arrayElement(departureGates);
        const arrivalGate = faker.helpers.arrayElement(arrivalGates);

        const value: NewFlight = {
          airline_id: airline.id,
          airplane_id: airplane.id,

          // Departure.
          departure_gate_id: departureGate.id,
          departure_planned_at: toSqlUtc(fromDate),
          departed_at: toSqlUtc(fromDate),

          // Arrival.
          arrival_gate_id: arrivalGate.id,
          arrival_planned_at: toSqlUtc(toDate),
          arrived_at: toSqlUtc(toDate),
        };

        return value;
      });
    })
    .filter((it) => it != null);

  await db
    .insertInto('flight')
    .values(flightValues)
    .returning(['id'])
    .execute();

  const profiles = await db
    .selectFrom('profile')
    .innerJoin('person', 'person.id', 'profile.person_id')
    .innerJoin('address', 'address.id', 'person.address_id')
    .innerJoin('city', 'city.id', 'address.city_id')
    .innerJoin('province', 'province.id', 'city.province_id')
    .innerJoin('country', 'country.id', 'province.country_id')
    .select([
      'profile.id',
      'profile.person_id',
      'address.city_id',
      'city.province_id',
      'province.country_id',
      'country.name as country_name',
    ])
    .execute();

  const people = await db
    .selectFrom('person')
    .innerJoin('address', 'address.id', 'person.address_id')
    .innerJoin('city', 'city.id', 'address.city_id')
    .innerJoin('province', 'province.id', 'city.province_id')
    .innerJoin('country', 'country.id', 'province.country_id')
    .select([
      'person.id',
      'address.city_id',
      'city.province_id',
      'province.country_id',
      'country.name as country_name',
    ])
    .execute();

  for (const profile of profiles) {
    console.log(`adding passengers from ${profile.country_name}`);

    // Find people from the same location as the current profile.
    const sameCountry = people.filter(
      (person) =>
        person.id !== profile.person_id &&
        person.country_id === profile.country_id
    );
    const sameProvince = sameCountry.filter(
      (person) => person.province_id === profile.province_id
    );
    const sameCity = sameProvince.filter(
      (person) => person.city_id === profile.city_id
    );

    let otherPersonIds: number[] = [];
    if (sameCity.length > 1) {
      otherPersonIds = sameCity.map((person) => person.id);
    } else if (sameProvince.length > 1) {
      otherPersonIds = sameProvince.map((person) => person.id);
    } else if (sameCountry.length > 1) {
      otherPersonIds = sameCountry.map((person) => person.id);
    }

    const departingFlights = await db
      .selectFrom('flight')
      .select(['flight.id', 'flight.airplane_id'])
      .innerJoin('gate', 'gate.id', 'flight.departure_gate_id')
      .innerJoin('airport', 'airport.id', 'gate.airport_id')
      .innerJoin('country', 'country.id', 'airport.country_id')
      .where('country.id', '=', profile.country_id)
      .limit(10)
      .execute();

    const flights = faker.helpers.arrayElements(departingFlights, 3);

    for (const flight of flights) {
      const personIds = [profile.person_id].concat(
        faker.helpers.arrayElements(otherPersonIds, 3)
      );

      const bookedAt = toSqlUtc(faker.date.recent({ days: 7 }));

      const payment = await db
        .insertInto('payment')
        .values({
          profile_id: profile.id,
          amount: 1000 * 100,
          payment_method_id: faker.helpers.arrayElement(paymentMethods).id,
          transaction_id: faker.string.uuid(),
          merchant_id: faker.string.uuid(),
          payed_at: bookedAt,
        })
        .returning(['id'])
        .executeTakeFirstOrThrow();

      const trip = await db
        .insertInto('trip')
        .values({
          profile_id: profile.id,
          booked_at: bookedAt,
          payment_id: payment.id,
          type: 'one_way',
        })
        .returning(['id'])
        .executeTakeFirstOrThrow();

      const reservedSeats = await db
        .selectFrom('passenger')
        .select(['airplane_seat_id'])
        .where('flight_id', '=', flight.id)
        .execute();

      let availableSeatsQuery = db
        .selectFrom('airplane_seat')
        .select(['airplane_id', 'id'])
        .where('airplane_id', '=', flight.airplane_id)
        .orderBy('airplane_seat.row', 'asc')
        .orderBy('airplane_seat.seat', 'asc');

      if (reservedSeats.length > 0) {
        availableSeatsQuery = availableSeatsQuery.where(
          'id',
          'not in',
          reservedSeats.map((it) => it.airplane_seat_id)
        );
      }
      const availableSeats = await availableSeatsQuery.execute();

      const pickedSeats = availableSeats.slice(0, personIds.length);

      const newPassengers = pickedSeats
        .map((seat, i) => {
          const personId = personIds[i];
          if (!personId) {
            return null;
          }

          const newPassenger: NewPassenger = {
            flight_id: flight.id,
            airplane_seat_id: seat.id,
            person_id: personId,
            trip_id: trip.id,
            boarded_at: null,
            checked_in_at: null,
          };
          return newPassenger;
        })
        .filter((it) => it != null);

      await db
        .insertInto('passenger')
        .values(newPassengers)
        .returning(['id'])
        .execute();
    }
  }

  return await db
    .selectFrom('flight')
    .select(['flight.id', 'flight.airplane_id'])
    .execute();
}
