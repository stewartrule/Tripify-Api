import { z } from 'zod';
import { publicEndpointsFactory } from '../util/endpointsFactory.js';
import { travelRisk } from '../util/travelRisk.js';

const country = z.object({
  id: z.int(),
  code: z.string(),
  name: z.string(),
  native_name: z.string(),
});

const output = z.object({
  countries: country.array(),
});

const input = z.object({});

export const countriesEndpoint = publicEndpointsFactory.build({
  input,
  output,
  handler: async ({ ctx: { db } }) => {
    const countries = await db
      .selectFrom('country')
      .select([
        'country.id',
        'country.code',
        'country.name',
        'country.native_name',
      ])
      .where('country.risk', '<=', travelRisk.moderate)
      .orderBy('name', 'asc')
      .execute();

    return { countries };
  },
});
