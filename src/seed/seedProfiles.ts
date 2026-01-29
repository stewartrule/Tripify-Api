import type { Selectable } from 'kysely';
import { Person, Profile } from '../db/generated.js';
import { db } from '../db/index.js';
import { NewProfile } from '../db/types.js';
import { hash } from '../util/password.js';

export async function seedProfile(
  person: Selectable<Person>,
  i: number
): Promise<NewProfile> {
  const image = await db
    .insertInto('image')
    .values({
      h: 53,
      s: 39,
      b: 77,
      name: `${person.first_name} ${person.last_name}`,
      src: `/images/avatar/${person.gender === 'm' ? 'male' : 'female'}/${
        i + 1
      }.webp`,
    })
    .returning('id')
    .executeTakeFirstOrThrow();

  if (i === 0) {
    console.time('hash');
  }

  const hashedPassword = await hash('tripify');

  if (i === 0) {
    console.timeEnd('hash');
  }

  const profile: NewProfile = {
    image_id: image.id,
    person_id: person.id,
    password: hashedPassword,
    email: person.email,
  };

  return profile;
}

export async function seedProfiles(
  people: Selectable<Person>[]
): Promise<Selectable<Profile>[]> {
  const male: NewProfile[] = await Promise.all(
    people
      .filter((person) => person.gender === 'm')
      .slice(0, 68)
      .map(async (person, i) => seedProfile(person, i))
  );

  const female: NewProfile[] = await Promise.all(
    people
      .filter((person) => person.gender === 'f')
      .slice(0, 93)
      .map(async (person, i) => seedProfile(person, i))
  );

  const values = male.concat(female);

  return db.insertInto('profile').values(values).returningAll().execute();
}
