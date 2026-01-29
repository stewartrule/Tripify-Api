import { faker } from '@faker-js/faker';
import type { Selectable } from 'kysely';
import { jsonArrayFrom } from 'kysely/helpers/postgres';
import { db } from '../db/index.js';
import { City } from '../db/generated.js';
import { NewEvent } from '../db/types.js';
import { toSqlUtc } from '../util/date.js';

export async function seedEvents(
  cities: Selectable<City>[]
): Promise<{ id: number }[]> {
  const leisure = await db
    .selectFrom('leisure')
    .select((eb) => [
      'leisure.id',
      'leisure.name',
      jsonArrayFrom(
        eb
          .selectFrom('leisure_image')
          .selectAll('leisure_image')
          .whereRef('leisure.id', '=', 'leisure_image.leisure_id')
      ).as('image'),
    ])
    .execute();

  const today = new Date();
  const max = faker.date.soon({ days: 62, refDate: today });

  const inserts = cities.map(async (city) => {
    const sample = faker.helpers.arrayElements(leisure, { min: 1, max: 3 });

    const eventValues = sample.map(async (row): Promise<NewEvent> => {
      const imageId = faker.helpers.arrayElement(
        row.image.map((it) => it.image_id)
      );
      const from = faker.date.between({ from: today, to: max });
      const to = faker.date.soon({
        days: faker.number.int({ min: 1, max: 7 }),
        refDate: from,
      });

      const address = await db
        .insertInto('address')
        .values({
          city_id: city.id,
          house_number: 3 + Math.round(Math.random() * 995),
          postal_code: `${1000 + Math.round(Math.random() * 8999)}`,
          street: faker.location.street(),
        })
        .returning('id')
        .executeTakeFirstOrThrow();

      return {
        name: `${row.name} ${city.name}`,
        price: faker.number.int({ min: 2, max: 20 }) * 500 + 99,
        description: faker.lorem.sentences(5),
        address_id: address.id,
        leisure_id: row.id,
        image_id: imageId,
        from_date: toSqlUtc(from),
        to_date: toSqlUtc(to),
      };
    });

    return await db
      .insertInto('event')
      .values(await Promise.all(eventValues))
      .returning('id')
      .execute();
  });

  const events = await Promise.all(inserts);
  return events.flat();
}
