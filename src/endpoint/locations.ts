import { z } from 'zod';
import { publicEndpointsFactory } from '../util/endpointsFactory.js';
import { v } from '../util/validator.js';
import { travelRisk } from '../util/travelRisk.js';

const uint = z.uint32();

const city = z.object({
  id: uint,
  name: z.string(),
  province_id: uint,
  province: z.string(),
  country_id: uint,
  country: z.string(),
  score: z.number(),
});

const province = z.object({
  id: uint,
  name: z.string(),
  country_id: uint,
  country: z.string(),
  score: z.number(),
});

const country = z.object({
  id: uint,
  name: z.string(),
  score: z.number(),
});

const accommodation = z.object({
  id: uint,
  name: z.string(),
  city_id: uint,
  city: z.string(),
  province_id: uint,
  province: z.string(),
  country_id: uint,
  country: z.string(),
  score: z.number(),
});

const airport = z.object({
  id: uint,
  name: z.string(),
  country_id: uint,
  country: z.string(),
  score: z.number(),
});

const output = z.object({
  cities: city.array(),
  provinces: province.array(),
  countries: country.array(),
  accommodations: accommodation.array(),
  airports: airport.array(),
});

const input = z.object({
  keyword: v.keyword().optional(),
});

type Output = z.infer<typeof output>;

export const locationsEndpoint = publicEndpointsFactory.build({
  input,
  output,
  handler: async ({
    input: { keyword = '' },
    ctx: { db },
  }): Promise<Output> => {
    if (keyword.length === 0) {
      return {
        countries: [],
        cities: [],
        provinces: [],
        airports: [],
        accommodations: [],
      };
    }

    const citiesQuery = db
      .selectFrom('city')
      .innerJoin('province', 'province.id', 'city.province_id')
      .innerJoin('country', 'country.id', 'province.country_id')
      .select(({ fn, val }) => [
        'city.id',
        'city.name',
        'city.province_id',
        'province.name as province',
        'province.country_id',
        'country.name as country',
        fn<number>('strict_word_similarity', ['city.name', val(keyword)]).as(
          'score'
        ),
      ])
      .orderBy('score', 'desc')
      .limit(5);

    const provincesQuery = db
      .selectFrom('province')
      .innerJoin('country', 'country.id', 'province.country_id')
      .select(({ fn, val }) => [
        'province.id',
        'province.name',
        'province.country_id',
        'country.name as country',
        fn<number>('strict_word_similarity', [
          'province.name',
          val(keyword),
        ]).as('score'),
      ])
      .orderBy('score', 'desc')
      .limit(5);

    const countriesQuery = db
      .selectFrom('country')
      .select(({ fn, val }) => [
        'country.id',
        'country.name',
        fn<number>('strict_word_similarity', ['country.name', val(keyword)]).as(
          'score'
        ),
      ])
      .where('country.risk', '<=', travelRisk.moderate)
      .orderBy('score', 'desc')
      .limit(5);

    const airportsQuery = db
      .selectFrom('airport')
      .innerJoin('country', 'country.id', 'airport.country_id')
      .select(({ fn, val }) => [
        'airport.id',
        'airport.name',
        'airport.country_id',
        'country.name as country',
        fn<number>('strict_word_similarity', ['airport.name', val(keyword)]).as(
          'score'
        ),
      ])
      .orderBy('score', 'desc')
      .limit(5);

    const [cities, provinces, countries, airports] = await Promise.all([
      citiesQuery.execute(),
      provincesQuery.execute(),
      countriesQuery.execute(),
      airportsQuery.execute(),
    ]);

    if (keyword.length < 6) {
      return { cities, provinces, countries, airports, accommodations: [] };
    }

    const accommodations = await db
      .selectFrom('accommodation')
      .innerJoin('address', 'address.id', 'accommodation.address_id')
      .innerJoin('city', 'city.id', 'address.city_id')
      .innerJoin('province', 'province.id', 'city.province_id')
      .innerJoin('country', 'country.id', 'province.country_id')
      .select(({ fn, val }) => [
        'accommodation.id',
        'accommodation.name',
        'address.city_id',
        'city.name as city',
        'city.province_id',
        'province.name as province',
        'province.country_id',
        'country.name as country',
        fn<number>('strict_word_similarity', [
          'accommodation.name',
          val(keyword),
        ]).as('score'),
      ])
      .orderBy('score', 'desc')
      .limit(5)
      .execute();

    return { cities, provinces, countries, airports, accommodations };
  },
});
