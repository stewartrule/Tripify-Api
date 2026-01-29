import { z } from 'zod';
import { publicEndpointsFactory } from '../util/endpointsFactory.js';

const filterOption = z.object({
  id: z.number(),
  name: z.string(),
});

const filterOptions = filterOption.array();

const output = z.object({
  accommodation_certification: filterOptions,
  accommodation_accessibility: filterOptions,
  accommodation_facility: filterOptions,
  accommodation_type: filterOptions,
  room_accessibility: filterOptions,
  room_facility: filterOptions,
  leisure: filterOptions,
  country: filterOptions,
});

const input = z.object({});

export const accommodationFiltersEndpoint = publicEndpointsFactory.build({
  input,
  output,
  handler: async ({ ctx: { db } }) => {
    const columns = ['id', 'name'] as const;
    const [
      accommodation_certification,
      accommodation_accessibility,
      accommodation_facility,
      accommodation_type,
      room_accessibility,
      room_facility,
      leisure,
      country,
    ] = await Promise.all([
      db
        .selectFrom('accommodation_certification')
        .select(columns)
        .orderBy('name', 'asc')
        .execute(),
      db
        .selectFrom('accommodation_accessibility')
        .select(columns)
        .orderBy('name', 'asc')
        .execute(),
      db
        .selectFrom('accommodation_facility')
        .select(columns)
        .orderBy('name', 'asc')
        .execute(),
      db
        .selectFrom('accommodation_type')
        .select(columns)
        .orderBy('name', 'asc')
        .execute(),
      db
        .selectFrom('room_accessibility')
        .select(columns)
        .orderBy('name', 'asc')
        .execute(),
      db
        .selectFrom('room_facility')
        .select(columns)
        .orderBy('name', 'asc')
        .execute(),
      db.selectFrom('leisure').select(columns).orderBy('name', 'asc').execute(),
      db
        .selectFrom('country')
        .select(columns)
        .where('risk', '<', 2)
        .orderBy('name', 'asc')
        .execute(),
    ]);

    return {
      accommodation_certification,
      accommodation_accessibility,
      accommodation_facility,
      accommodation_type,
      room_accessibility,
      room_facility,
      leisure,
      country,
    };
  },
});
