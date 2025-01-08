import { faker } from '@faker-js/faker';
import type { Selectable } from 'kysely';
import { db } from '../db';
import { Accommodation, Country } from '../db/generated';
import { NewAccommodationPrice } from '../db/types';
import { accommodationData } from './scraped/accommodationData';
import {
  accomodationAccessibilityData,
  accomodationCertificationData,
  accomodationFacilityData,
  accomodationTypeData,
  roomAccessibilityData,
  roomFacilityData,
} from './scraped/filterData';
import { leisureData } from './scraped/leisureData';

export async function seedAccommodations(
  countries: Selectable<Country>[]
): Promise<Selectable<Accommodation>[]> {
  const accomodationTypes = await db
    .insertInto('accommodation_type')
    .values(accomodationTypeData.map((name) => ({ name })))
    .returningAll()
    .execute();

  const accomodationAccessiblities = await db
    .insertInto('accommodation_accessibility')
    .values(accomodationAccessibilityData.map((name) => ({ name })))
    .returningAll()
    .execute();

  const accomodationFacilities = await db
    .insertInto('accommodation_facility')
    .values(accomodationFacilityData.map((name) => ({ name })))
    .returningAll()
    .execute();

  const roomAccessiblities = await db
    .insertInto('room_accessibility')
    .values(roomAccessibilityData.map((name) => ({ name })))
    .returningAll()
    .execute();

  const accommodationCertifications = await db
    .insertInto('accommodation_certification')
    .values(accomodationCertificationData.map((name) => ({ name })))
    .returningAll()
    .execute();

  const leisureNames = Array.from(
    new Set(leisureData.map(({ keyword }) => keyword))
  );
  const leisure = await db
    .insertInto('leisure')
    .values(leisureNames.map((name) => ({ name })))
    .returningAll()
    .execute();

  const leisureImages = leisure.map(async (row) => {
    const pexels = leisureData.filter(({ keyword }) => row.name === keyword);

    const imageIds = await db
      .insertInto('image')
      .values(
        pexels.map(({ hsb, alt, original_id }) => ({
          h: hsb[0],
          s: hsb[1],
          b: hsb[2],
          name: alt,
          src: `/images/leisure/${original_id}.webp`,
        }))
      )
      .returning('id')
      .execute();

    await db
      .insertInto('leisure_image')
      .values(
        imageIds.map(({ id }) => ({
          image_id: id,
          leisure_id: row.id,
        }))
      )
      .returning('id')
      .execute();
  });
  await Promise.all(leisureImages);

  // Room facilities.
  const beachFacilities = await db
    .insertInto('room_facility')
    .values(roomFacilityData.beach.map((name) => ({ name })))
    .returningAll()
    .execute();

  const commonFacilities = await db
    .insertInto('room_facility')
    .values(roomFacilityData.common.map((name) => ({ name })))
    .returningAll()
    .execute();

  const maybeFacilities = await db
    .insertInto('room_facility')
    .values(roomFacilityData.maybe.map((name) => ({ name })))
    .returningAll()
    .execute();

  const luxuryFacilities = await db
    .insertInto('room_facility')
    .values(roomFacilityData.luxury.map((name) => ({ name })))
    .returningAll()
    .execute();

  const allCities = await db
    .selectFrom('city')
    .innerJoin('province', 'province.id', 'city.province_id')
    .innerJoin('country', 'country.id', 'province.country_id')
    .select(['city.id', 'city.name', 'country.name as country'])
    .execute();

  let accommodations: Selectable<Accommodation>[] = [];
  for (const country of countries) {
    const cities = allCities
      .filter((city) => city.country === country.name)
      .slice(0, 25);

    const adjectives = ['Sunrise', 'Luxury', 'Southside', 'Boutique'];
    for (const city of cities) {
      for (const accomodationType of accomodationTypes) {
        const sample = faker.helpers.arrayElements(
          accommodationData.filter(
            (data) => data.keyword === accomodationType.name
          ),
          { min: 1, max: 2 }
        );

        const result: Selectable<Accommodation>[] = await Promise.all(
          sample.map(async (pexel, i) => {
            const adjective = adjectives[i] || 'Southside';
            const name = `${city.name} ${adjective} ${pexel.keyword}`;

            const image = await db
              .insertInto('image')
              .values({
                h: pexel.hsb[0] || 0,
                s: pexel.hsb[1] || 0,
                b: pexel.hsb[2] || 0,
                name,
                src: `/images/accommodation/${pexel.original_id}.webp`,
              })
              .returning('id')
              .executeTakeFirstOrThrow();

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

            const isNearBeach = pexel.alt.toLowerCase().includes('sea')
              ? true
              : Math.random() > 0.75;
            const distanceToBeach = isNearBeach
              ? Math.round(Math.random() * 10) * 50
              : 1000 + Math.ceil(Math.random() * 1000) * 10;

            const accommodation = await db
              .insertInto('accommodation')
              .values({
                name,
                accommodation_type_id: accomodationType.id,
                address_id: address.id,
                description: pexel.alt,
                distance_to_beach: distanceToBeach,
                square_meters: faker.number.int({ min: 40, max: 120 }),
                number_of_bathrooms: faker.number.int({ min: 1, max: 4 }),
                number_of_bedrooms: faker.number.int({ min: 1, max: 4 }),
              })
              .returningAll()
              .executeTakeFirstOrThrow();

            // Weekly prices.
            const basePrice = faker.number.int({ min: 40, max: 120 }) * 100;
            const numWeeks = 52;
            const f = Math.PI / numWeeks;
            const accommodationPriceValues = Array.from({
              length: numWeeks,
            }).map(
              (_, i): NewAccommodationPrice => ({
                accommodation_id: accommodation.id,
                price:
                  basePrice + Math.round(Math.sin(i * f) * (basePrice / 2)),
                week: i + 1,
              })
            );

            const accommodationCertificationValues = random(
              accommodationCertifications,
              1,
              3
            ).map((row) => ({
              accommodation_id: accommodation.id,
              accommodation_certification_id: row.id,
            }));

            const accomodationAccessibilityValues = random(
              accomodationAccessiblities,
              1,
              3
            ).map((row) => ({
              accommodation_id: accommodation.id,
              accommodation_accessibility_id: row.id,
            }));

            const accomodationFacilityValues = random(
              accomodationFacilities,
              1,
              5
            ).map((row) => ({
              accommodation_id: accommodation.id,
              accommodation_facility_id: row.id,
            }));

            const roomAccessibilityValues = random(
              roomAccessiblities,
              1,
              4
            ).map((row) => ({
              accommodation_id: accommodation.id,
              room_accessibility_id: row.id,
            }));

            const leisureValues = random(leisure, 1, 3).map((row) => ({
              accommodation_id: accommodation.id,
              leisure_id: row.id,
            }));

            await Promise.all([
              db
                .insertInto('accommodation_image')
                .values({
                  accommodation_id: accommodation.id,
                  image_id: image.id,
                })
                .execute(),

              db
                .insertInto('accommodation_price')
                .values(accommodationPriceValues)
                .execute(),

              db
                .insertInto('accommodation_accommodation_certification')
                .values(accommodationCertificationValues)
                .execute(),

              db
                .insertInto('accommodation_accommodation_accessibility')
                .values(accomodationAccessibilityValues)
                .execute(),

              db
                .insertInto('accommodation_accommodation_facility')
                .values(accomodationFacilityValues)
                .execute(),

              db
                .insertInto('accommodation_room_accessibility')
                .values(roomAccessibilityValues)
                .execute(),

              db
                .insertInto('accommodation_leisure')
                .values(leisureValues)
                .execute(),

              // Room facilities.
              db
                .insertInto('accommodation_room_facility')
                .values(
                  commonFacilities.map((row) => ({
                    accommodation_id: accommodation.id,
                    room_facility_id: row.id,
                  }))
                )
                .execute(),

              db
                .insertInto('accommodation_room_facility')
                .values(
                  random(maybeFacilities, 3, 5).map((row) => ({
                    accommodation_id: accommodation.id,
                    room_facility_id: row.id,
                  }))
                )
                .execute(),

              db
                .insertInto('accommodation_room_facility')
                .values(
                  random(luxuryFacilities, 1, 3).map((row) => ({
                    accommodation_id: accommodation.id,
                    room_facility_id: row.id,
                  }))
                )
                .execute(),
            ]);

            if (accommodation.distance_to_beach <= 500) {
              const facility = faker.helpers.arrayElement(beachFacilities);

              await db
                .insertInto('accommodation_room_facility')
                .values({
                  accommodation_id: accommodation.id,
                  room_facility_id: facility!.id,
                })
                .execute();
            }

            console.log(
              `Added ${accomodationType.name} accommodations for ${city.name}`
            );

            return accommodation;
          })
        );

        accommodations = accommodations.concat(result);
      }
    }
  }

  return accommodations;
}

function random<T>(arr: T[], min = 1, max = 3): T[] {
  const diff = max - min;
  return arr
    .slice()
    .sort(() => (Math.random() > 0.5 ? 1 : -1))
    .slice(0, min + Math.round(Math.random() * diff));
}
