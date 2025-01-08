import { faker } from '@faker-js/faker';
import type { Selectable } from 'kysely';
import { db } from '../db';
import { Accommodation, Profile } from '../db/generated';
import { NewAccommodationReview } from '../db/types';

export async function seedReviews(
  accommodations: Selectable<Accommodation>[],
  profiles: Selectable<Profile>[]
): Promise<{ id: number }[]> {
  const reviews = await Promise.all(
    accommodations.flatMap(async (accommodation) => {
      const reviewers = faker.helpers.arrayElements(profiles, {
        min: 1,
        max: 8,
      });

      const values = reviewers.map(
        (reviewer): NewAccommodationReview => ({
          accommodation_id: accommodation.id,
          profile_id: reviewer.id,
          accuracy_rating: faker.number.int({ min: 1, max: 10 }),
          cleanliness_rating: faker.number.int({ min: 1, max: 10 }),
          communication_rating: faker.number.int({ min: 1, max: 10 }),
          value_rating: faker.number.int({ min: 1, max: 10 }),
          review: faker.lorem.sentences(2),
        })
      );

      const reviews = await db
        .insertInto('accommodation_review')
        .values(values)
        .returning('id')
        .execute();

      console.log(`inserted reviews for accommodation ${accommodation.id}`);

      return reviews;
    })
  );

  return reviews.flat();
}
