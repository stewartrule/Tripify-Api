import { ExpressionBuilder } from 'kysely';
import { jsonArrayFrom, jsonObjectFrom } from 'kysely/helpers/postgres';
import { DB } from '../db/generated.js';

type EB = ExpressionBuilder<DB, 'accommodation'>;

export function withAccommodationImages(eb: EB) {
  return jsonArrayFrom(
    eb
      .selectFrom('image')
      .select(['image.src', 'image.h', 'image.s', 'image.b', 'image.id'])
      .innerJoin(
        'accommodation_image',
        'accommodation_image.image_id',
        'image.id'
      )
      .whereRef('accommodation_image.accommodation_id', '=', 'accommodation.id')
  );
}

export function withAccommodationCertifications(eb: EB) {
  return jsonArrayFrom(
    eb
      .selectFrom('accommodation_certification')
      .select([
        'accommodation_certification.id',
        'accommodation_certification.name',
      ])
      .innerJoin(
        'accommodation_accommodation_certification',
        'accommodation_accommodation_certification.accommodation_id',
        'accommodation.id'
      )
      .whereRef(
        'accommodation_certification.id',
        '=',
        'accommodation_accommodation_certification.accommodation_certification_id'
      )
  );
}

export function withAccommodationLeisures(eb: EB) {
  return jsonArrayFrom(
    eb
      .selectFrom('leisure')
      .select(['leisure.id', 'leisure.name'])
      .innerJoin(
        'accommodation_leisure',
        'accommodation_leisure.accommodation_id',
        'accommodation.id'
      )
      .whereRef('leisure.id', '=', 'accommodation_leisure.leisure_id')
  );
}

export function withAccommodationAccessibilities(eb: EB) {
  return jsonArrayFrom(
    eb
      .selectFrom('accommodation_accessibility')
      .select([
        'accommodation_accessibility.id',
        'accommodation_accessibility.name',
      ])
      .innerJoin(
        'accommodation_accommodation_accessibility',
        'accommodation_accommodation_accessibility.accommodation_id',
        'accommodation.id'
      )
      .whereRef(
        'accommodation_accessibility.id',
        '=',
        'accommodation_accommodation_accessibility.accommodation_accessibility_id'
      )
  );
}

export function withAccommodationFacilities(eb: EB) {
  return jsonArrayFrom(
    eb
      .selectFrom('accommodation_facility')
      .select(['accommodation_facility.id', 'accommodation_facility.name'])
      .innerJoin(
        'accommodation_accommodation_facility',
        'accommodation_accommodation_facility.accommodation_id',
        'accommodation.id'
      )
      .whereRef(
        'accommodation_facility.id',
        '=',
        'accommodation_accommodation_facility.accommodation_facility_id'
      )
  );
}

export function withAccommodationAddress(eb: EB) {
  return jsonObjectFrom(
    eb
      .selectFrom('address')
      .select((eb) => [
        'address.id',
        'address.house_number',
        'address.postal_code',
        'address.street',
        jsonObjectFrom(
          eb
            .selectFrom('city')
            .selectAll()
            .whereRef('address.city_id', '=', 'city.id')
        ).as('city'),
      ])
      .whereRef('address.id', '=', 'accommodation.address_id')
  );
}

export function withAccommodationReviews(eb: EB) {
  return jsonArrayFrom(
    eb
      .selectFrom('accommodation_review')
      .innerJoin('profile', 'accommodation_review.profile_id', 'profile.id')
      .innerJoin('person', 'person.id', 'profile.person_id')
      .innerJoin('address', 'person.address_id', 'address.id')
      .innerJoin('city', 'address.city_id', 'city.id')
      .innerJoin('province', 'city.province_id', 'province.id')
      .innerJoin('country', 'province.country_id', 'country.id')
      .leftJoin('image', 'image.id', 'profile.image_id')
      .select((eb) => [
        'accommodation_review.id',
        'accommodation_review.accuracy_rating',
        'accommodation_review.cleanliness_rating',
        'accommodation_review.communication_rating',
        'accommodation_review.value_rating',
        'accommodation_review.review',
        'accommodation_review.profile_id',
        'person.first_name',
        'country.name as country',
        'country.id as country_id',
        jsonObjectFrom(
          eb
            .selectFrom('image')
            .select([
              'image.h',
              'image.s',
              'image.b',
              'image.src',
              'image.name',
            ])
            .whereRef('image.id', '=', 'profile.image_id')
        ).as('image'),
      ])
      .whereRef(
        'accommodation_review.accommodation_id',
        '=',
        'accommodation.id'
      )
  );
}
