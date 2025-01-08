import { z } from 'zod';
import { publicEndpointsFactory } from '../util/endpointsFactory';
import { ez } from 'express-zod-api';
import { jsonObjectFrom } from 'kysely/helpers/postgres';
import { getDistanceFromLatLonInKm } from '../util/getDistanceFromLatLonInKm';
import { v } from '../util/validator';

const flight = z.any();

const output = z.object({
  flights: flight.array(),
});

const input = z.object({
  departure_date: ez.dateIn().optional(),
  from_country_id: v.id().optional(),
  to_country_id: v.id().optional(),

  // Sorting.
  direction: z.enum(['asc', 'desc']).optional(),
  order_by: z.enum(['planned_departure_at', 'airline']).optional(),
  limit: v.limit(),
});

export const flightsEndpoint = publicEndpointsFactory.build({
  input,
  output,
  handler: async ({
    input: {
      departure_date = new Date(),
      from_country_id,
      to_country_id,
      direction = 'asc',
      order_by = 'planned_departure_at',
      limit = 80,
    },
    options: { db },
  }) => {
    let query = db
      .selectFrom('flight')
      .innerJoin('airline', 'flight.airline_id', 'airline.id')
      .innerJoin(
        'airport as departure_airport',
        'departure_airport.id',
        'flight.departure_airport_id'
      )
      .innerJoin(
        'airport as arrival_airport',
        'arrival_airport.id',
        'flight.arrival_airport_id'
      )
      .select((eb) => [
        'flight.id',
        'flight.airline_id',
        'airline.name as airline',
        'airline.logo_src as airline_logo_src',

        'flight.airplane_id',

        // Departure.
        'flight.departure_airport_id',
        'flight.departure_at',
        'flight.departure_gate',
        'flight.planned_departure_at',

        'departure_airport.country_id as departure_country_id',

        // Arrival.
        'flight.arrival_airport_id',
        'flight.arrival_at',
        'flight.arrival_gate',
        'flight.planned_arrival_at',

        'arrival_airport.country_id as arrival_country_id',

        // Departure.
        jsonObjectFrom(
          eb
            .selectFrom('airport')
            .select((eb) => [
              'airport.id',
              'airport.name',
              'airport.iata',
              'airport.latitude',
              'airport.longitude',
              jsonObjectFrom(
                eb
                  .selectFrom('country')
                  .select(['country.id', 'country.name'])
                  .whereRef('airport.country_id', '=', 'country.id')
              ).as('country'),
            ])
            .whereRef('airport.id', '=', 'flight.departure_airport_id')
        ).as('departure_airport'),

        // Arrival.
        jsonObjectFrom(
          eb
            .selectFrom('airport')
            .select((eb) => [
              'airport.id',
              'airport.name',
              'airport.iata',
              'airport.latitude',
              'airport.longitude',
              jsonObjectFrom(
                eb
                  .selectFrom('country')
                  .select(['country.id', 'country.name'])
                  .whereRef('airport.country_id', '=', 'country.id')
              ).as('country'),
            ])
            .whereRef('airport.id', '=', 'flight.arrival_airport_id')
        ).as('arrival_airport'),
      ])
      .where('flight.planned_departure_at', '>=', departure_date)
      .orderBy(order_by, direction)
      .limit(limit);

    if (from_country_id != null) {
      query = query.where('departure_airport.country_id', '=', from_country_id);
    }

    if (to_country_id != null) {
      query = query.where('arrival_airport.country_id', '=', to_country_id);
    }

    const flights = await query.execute();

    return {
      flights: flights.map((flight) => {
        const distance = getDistanceFromLatLonInKm(
          flight.departure_airport?.latitude || 0,
          flight.departure_airport?.longitude || 0,
          flight.arrival_airport?.latitude || 0,
          flight.arrival_airport?.longitude || 0
        );
        return {
          ...flight,
          distance: Math.round(distance),
        };
      }),
    };
  },
});
