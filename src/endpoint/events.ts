import { ez } from 'express-zod-api';
import { jsonObjectFrom } from 'kysely/helpers/postgres';
import { z } from 'zod';
import { publicEndpointsFactory } from '../util/endpointsFactory.js';
import { v } from '../util/validator.js';

const event = z.record(z.string(), z.any());

const output = z.object({
  events: event.array(),
});

const input = z.object({
  date: ez.dateIn().optional(),
  country_ids: v.ids().optional(),
  province_ids: v.ids().optional(),
  city_ids: v.ids().optional(),
  direction: z.enum(['asc', 'desc']).optional(),
  order_by: z.enum(['from_date', 'price', 'city']).optional(),
  limit: v.limit(),
});

export const eventsEndpoint = publicEndpointsFactory.build({
  input,
  output,
  handler: async ({
    input: {
      date = new Date(),
      country_ids = [],
      order_by = 'from_date',
      direction = 'asc',
      limit = 40,
    },
    ctx: { db },
  }) => {
    let query = db
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
      ])
      .where('event.from_date', '>=', date)
      .orderBy(order_by, direction)
      .limit(limit);

    if (country_ids.length > 0) {
      query = query.where('country_id', 'in', country_ids);
    }

    const events = await query.execute();

    return { events };
  },
});
