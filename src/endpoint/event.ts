import createHttpError from 'http-errors';
import { jsonObjectFrom } from 'kysely/helpers/postgres';
import { z } from 'zod';
import { publicEndpointsFactory } from '../util/endpointsFactory';
import { v } from '../util/validator';

const event = z.record(z.any());
const output = z.object({
  event,
});

const input = z.object({
  id: v.id(),
});

export const eventEndpoint = publicEndpointsFactory.build({
  input,
  output,
  handler: async ({ input: { id }, options: { db } }) => {
    const event = await db
      .selectFrom('event')
      .innerJoin('leisure', 'leisure.id', 'event.leisure_id')
      .innerJoin('address', 'address.id', 'event.address_id')
      .innerJoin('city', 'city.id', 'address.city_id')
      .innerJoin('province', 'province.id', 'city.province_id')
      .innerJoin('country', 'country.id', 'province.country_id')
      .innerJoin('image', 'image.id', 'event.image_id')
      .select((eb) => [
        'event.id',
        'event.name',
        'event.description',
        'event.from_date',
        'event.to_date',
        'event.price',
        'leisure.id as leisure_id',
        'leisure.name as leisure',
        'city.id as city_id',
        'city.name as city',
        'province.id as province_id',
        'province.name as province',
        'country.id as country_id',
        'country.name as country',
        jsonObjectFrom(
          eb
            .selectFrom('image')
            .selectAll('image')
            .whereRef('image.id', '=', 'event.image_id')
        ).as('image'),
        jsonObjectFrom(
          eb
            .selectFrom('address')
            .selectAll('address')
            .whereRef('address.id', '=', 'event.address_id')
        ).as('address'),
      ])
      .where('event.id', '=', id)
      .orderBy('event.from_date', 'asc')
      .limit(1)
      .executeTakeFirst();

    if (!event) {
      throw createHttpError(404);
    }

    return { event };
  },
});
