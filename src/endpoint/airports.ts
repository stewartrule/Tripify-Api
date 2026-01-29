import { sql } from 'kysely';
import { z } from 'zod';
import { publicEndpointsFactory } from '../util/endpointsFactory.js';
import { v } from '../util/validator.js';

const airport = z.object({
  id: z.int(),
  name: z.string(),
  iata: z.string(),
  is_iata: v.sqlBool(),
  score: z.number(),
  country: z.string(),
  country_id: z.int(),
});

const output = z.object({
  airports: airport.array(),
});

const input = z.object({
  keyword: v.keyword().optional(),
});

export const airportsEndpoint = publicEndpointsFactory.build({
  input,
  output,
  handler: async ({ input: { keyword = '' }, ctx: { db } }) => {
    if (keyword.length === 0) {
      return {
        airports: [],
      };
    }

    const airports = await db
      .selectFrom('airport')
      .innerJoin('country', 'country.id', 'airport.country_id')
      .select((eb) => [
        'airport.id',
        'airport.name',
        'airport.iata',
        'airport.country_id',
        'country.name as country',
        eb('airport.iata', '=', keyword.toUpperCase()).as('is_iata'),
        sql<number>`greatest(strict_word_similarity(${eb.ref(
          'airport.name'
        )}, ${keyword}), strict_word_similarity(${eb.ref(
          'country.name'
        )}, ${keyword}))`.as('score'),
      ])
      .orderBy('is_iata', 'desc')
      .orderBy('score', 'desc')
      .limit(20)
      .execute();

    return {
      airports,
    };
  },
});
