import createHttpError from 'http-errors';
import { jsonObjectFrom } from 'kysely/helpers/postgres';
import { z } from 'zod';
import { publicEndpointsFactory } from '../util/endpointsFactory.js';
import { v } from '../util/validator.js';
import { ez } from 'express-zod-api';

const uint = z.uint32();

const passenger = z.object({
  id: uint,
  airplane_seat_id: uint,
  boarded_at: ez.dateOut().nullable(),
  checked_in_at: ez.dateOut().nullable(),
  flight_id: uint,
  person_id: uint,
  return_flight: z.boolean(),
  trip_id: uint,
});

const seat = z.object({
  id: uint,
  type: z.enum(['business', 'economy', 'first']),
  row: uint,
  seat: z.string(),
  passenger: passenger.nullable(),
});

const country = z.object({
  id: uint,
  name: z.string(),
});

const airport = z.object({
  id: uint,
  name: z.string(),
  iata: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  country: country.nullable(),
});

const flight = z.object({
  id: uint,
  airline_id: uint,
  airplane_id: uint,
  arrival_gate_id: uint,
  arrival_planned_at: ez.dateOut(),
  arrived_at: ez.dateOut().nullable(),
  departed_at: ez.dateOut().nullable(),
  departure_gate_id: uint,
  departure_planned_at: ez.dateOut(),
  airline: z.string(),
  airline_logo_src: z.string(),
  departure_country_id: uint,
  arrival_country_id: uint,
  departure_airport: airport.nullable(),
  arrival_airport: airport.nullable(),
});

const output = z.object({
  flight,
  seats: seat.array(),
});

const input = z.object({
  id: v.id(),
});

export const flightEndpoint = publicEndpointsFactory.build({
  input,
  output,
  handler: async ({ input: { id }, ctx: { db } }) => {
    let query = db
      .selectFrom('flight')
      .innerJoin('airline', 'flight.airline_id', 'airline.id')
      .innerJoin(
        'gate as departure_gate',
        'departure_gate.id',
        'flight.departure_gate_id'
      )
      .innerJoin(
        'gate as arrival_gate',
        'arrival_gate.id',
        'flight.arrival_gate_id'
      )
      .innerJoin(
        'airport as departure_airport',
        'departure_airport.id',
        'arrival_gate.airport_id'
      )
      .innerJoin(
        'airport as arrival_airport',
        'arrival_airport.id',
        'arrival_gate.airport_id'
      )
      .select((eb) => [
        'flight.id',
        'flight.airline_id',
        'airline.name as airline',
        'airline.logo_src as airline_logo_src',

        'flight.airplane_id',

        // Departure.
        'flight.departure_gate_id',
        'flight.departed_at',
        'flight.departure_planned_at',

        'departure_airport.country_id as departure_country_id',

        // Arrival.
        'flight.arrival_gate_id',
        'flight.arrived_at',
        'flight.arrival_planned_at',

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
            .whereRef('airport.id', '=', 'departure_gate.airport_id')
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
            .whereRef('airport.id', '=', 'arrival_gate.airport_id')
        ).as('arrival_airport'),
      ])
      .where('flight.id', '=', id)
      .limit(1);

    const flight = await query.executeTakeFirst();
    if (!flight) {
      throw createHttpError(404);
    }

    const passengers = await db
      .selectFrom('passenger')
      .selectAll()
      .where('passenger.flight_id', '=', flight.id)
      .execute();

    const rows = await db
      .selectFrom('airplane_seat')
      .select(['id', 'row', 'seat', 'type'])
      .where('airplane_seat.airplane_id', '=', flight.airplane_id)
      .orderBy('airplane_seat.row', 'asc')
      .orderBy('airplane_seat.seat', 'asc')
      .execute();

    const seats = rows.map((seat) => ({
      ...seat,
      passenger:
        passengers.find(
          (passenger) => passenger.airplane_seat_id === seat.id
        ) || null,
    }));

    return {
      flight,
      seats,
    };
  },
});
