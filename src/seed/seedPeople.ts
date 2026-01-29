import { faker } from '@faker-js/faker';
import type { Selectable } from 'kysely';
import { db } from '../db/index.js';
import { City, Person } from '../db/generated.js';
import { NewPerson } from '../db/types.js';

async function seedPerson(
  city: Selectable<City>,
  sex: 'male' | 'female'
): Promise<NewPerson> {
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
  const domainName = faker.internet.domainName();
  const email = `${faker.helpers.slugify(firstName)}.${faker.helpers.slugify(
    lastName
  )}@${domainName}`.toLowerCase();

  const value: NewPerson = {
    first_name: firstName,
    last_name: lastName,
    telephone: faker.phone.number({ style: 'international' }),
    date_of_birth: faker.date.between({ from: '1960-01-01', to: '2005-01-01' }),
    address_id: address.id,
    gender: sex === 'female' ? 'f' : 'm',
    email,
  };

  return value;
}

export async function seedPeople(
  allCities: Selectable<City>[]
): Promise<Selectable<Person>[]> {
  let cities: Selectable<City>[] = [];

  cities = faker.helpers.arrayElements(allCities, 500);
  let male: NewPerson[] = await Promise.all(
    cities.map((city) => seedPerson(city, 'male'))
  );

  cities = faker.helpers.arrayElements(allCities, 500);
  let female: NewPerson[] = await Promise.all(
    cities.map((city) => seedPerson(city, 'female'))
  );

  let newPeople: NewPerson[] = male.concat(female);

  const people = await db
    .insertInto('person')
    .values(newPeople)
    .returningAll()
    .execute();

  console.log(`inserted people`);

  return people;
}
