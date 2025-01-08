import { faker } from '@faker-js/faker';
import type { Selectable } from 'kysely';
import { db } from '../db';
import { City, Profile } from '../db/generated';
import { NewProfile } from '../db/types';

async function seedProfile(
  city: Selectable<City>,
  index: number,
  sex: 'male' | 'female'
): Promise<NewProfile> {
  const address = await db
    .insertInto('address')
    .values({
      city_id: city.id,
      house_number: 3 + Math.round(Math.random() * 785),
      postal_code: `${1000 + Math.round(Math.random() * 8999)}`,
      street: faker.location.street(),
    })
    .returning('id')
    .executeTakeFirstOrThrow();

  const firstName = faker.person.firstName(sex);
  const lastName = faker.person.lastName(sex);

  const image = await db
    .insertInto('image')
    .values({
      h: 53,
      s: 39,
      b: 77,
      name: `${firstName} ${lastName}`,
      src: `/images/avatar/${sex}/${index}.webp`,
    })
    .returning('id')
    .executeTakeFirstOrThrow();

  const value: NewProfile = {
    first_name: firstName,
    last_name: lastName,
    telephone: faker.phone.number({ style: 'international' }),
    date_of_birth: faker.date.between({ from: '1978-01-01', to: '2004-01-01' }),
    address_id: address.id,
    image_id: image.id,
  };

  return value;
}

export async function seedProfiles(
  allCities: Selectable<City>[]
): Promise<Selectable<Profile>[]> {
  let cities: Selectable<City>[] = [];

  cities = faker.helpers.arrayElements(allCities, 68);
  let newMaleProfiles: NewProfile[] = await Promise.all(
    cities.map(async (city, i) => await seedProfile(city, i + 1, 'male'))
  );

  console.log(`generated male profiles`);

  cities = faker.helpers.arrayElements(allCities, 93);
  let newFemaleProfiles: NewProfile[] = await Promise.all(
    cities.map(async (city, i) => await seedProfile(city, i + 1, 'female'))
  );

  console.log(`generated female profiles`);

  let newProfiles: NewProfile[] = newMaleProfiles.concat(newFemaleProfiles);

  const profiles = await db
    .insertInto('profile')
    .values(newProfiles)
    .returningAll()
    .execute();

  return profiles;
}
