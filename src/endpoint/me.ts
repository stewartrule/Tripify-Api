import createHttpError from 'http-errors';
import { z } from 'zod';
import { publicEndpointsFactory } from '../util/endpointsFactory.js';
import { jsonObjectFrom } from 'kysely/helpers/postgres';

const anyRec = z.record(z.string(), z.any());

const output = z.object({
  profile: anyRec,
  trips: anyRec.array(),
});

const input = z.object({});

type Output = z.infer<typeof output>;

export const meEndpoint = publicEndpointsFactory.build({
  input,
  output,
  handler: async ({ input: {}, ctx: { db } }): Promise<Output> => {
    const id = 2;
    const profile = await db
      .selectFrom('profile')
      .innerJoin('person', 'person.id', 'profile.id')
      .select((eb) => [
        'profile.id as profile_id',
        'profile.person_id',
        'person.date_of_birth',
        'person.first_name',
        'person.last_name',
        'person.telephone',
        'person.email',
      ])
      .where('profile.id', '=', id)
      .executeTakeFirst();

    if (!profile) {
      throw createHttpError(404);
    }

    const trips = await db
      .selectFrom('trip')
      .selectAll()
      .where('profile_id', '=', profile.profile_id)
      .orderBy('booked_at', 'desc')
      .execute();

    const trips2 = await Promise.all(
      trips.map(async (trip) => {
        const passengers = await db
          .selectFrom('passenger')
          .select((eb) => [
            'passenger.id',
            'passenger.airplane_seat_id',
            'passenger.boarded_at',
            'passenger.person_id',
            'passenger.checked_in_at',
            'passenger.flight_id',
            'passenger.return_flight',
            'passenger.checked_in_at',
            jsonObjectFrom(
              eb
                .selectFrom('person')
                .innerJoin('address', 'address.id', 'person.address_id')
                .innerJoin('city', 'city.id', 'address.city_id')
                .innerJoin('province', 'province.id', 'city.province_id')
                .innerJoin('country', 'country.id', 'province.country_id')
                .select([
                  'person.id',
                  'person.email',
                  'person.address_id',
                  'city.id as city_id',
                  'province.id as province_id',
                  'country.id as country_id',
                ])
                .whereRef('person.id', '=', 'passenger.person_id')
            ).as('person'),

            jsonObjectFrom(
              eb
                .selectFrom('flight')
                .select((eb) => [
                  'flight.id',
                  'flight.departure_planned_at',
                  'flight.departure_gate_id',
                  'flight.arrival_planned_at',
                  'flight.arrival_gate_id',
                ])
                .whereRef('flight.id', '=', 'passenger.flight_id')
            ).as('flight'),
          ])
          .where('passenger.trip_id', '=', trip.id)
          .orderBy('passenger.flight_id', 'asc')
          .execute();

        return {
          ...trip,
          passengers,
        };
      })
    );

    return { profile, trips: trips2 };
  },
});
