import { z } from 'zod';
import {
  withAccommodationAccessibilities,
  withAccommodationFacilities,
  withAccommodationImages,
  withRoomAccessibilities,
  withRoomFacilities,
  withAccommodationCertifications,
} from '../query/accommodation';
import { publicEndpointsFactory } from '../util/endpointsFactory';
import { v } from '../util/validator';

const accommodation = z.record(z.any());

const ids = v.ids();

const input = z.object({
  // Location filters.
  country_ids: ids.optional(),
  province_ids: ids.optional(),
  city_ids: ids.optional(),

  // Id array filters.
  accommodation_certification_ids: ids.optional(),
  accommodation_accessibility_ids: ids.optional(),
  accommodation_facility_ids: ids.optional(),
  accommodation_type_ids: ids.optional(),
  room_accessibility_ids: ids.optional(),
  room_facility_ids: ids.optional(),

  // Regular filters.
  max_distance_to_beach: z
    .string()
    .regex(/^\d{1,10}$/)
    .transform((it) => parseInt(it, 10))
    .optional(),

  // Search.
  keyword: v.keyword().optional(),

  // Sorting.
  direction: z.enum(['asc', 'desc']).optional(),
  order_by: z
    .enum([
      'distance_to_beach',
      'number_of_bathrooms',
      'number_of_bedrooms',
      'square_meters',

      'avg_accuracy_rating',
      'avg_cleanliness_rating',
      'avg_communication_rating',
      'avg_value_rating',

      'review_count',
    ])
    .optional(),
  limit: v.limit(),
});

const output = z.object({
  count: z.number(),
  accommodations: accommodation.array(),
});

export const accommodationsEndpoint = publicEndpointsFactory.build({
  input,
  output,
  handler: async ({
    input: {
      // Location.
      country_ids = [],
      province_ids = [],
      city_ids = [],

      // Id array filters.
      accommodation_certification_ids = [],
      accommodation_accessibility_ids = [],
      accommodation_facility_ids = [],
      accommodation_type_ids = [],
      room_accessibility_ids = [],
      room_facility_ids = [],

      // Regular filters.
      keyword,
      max_distance_to_beach,

      // Sorting.
      order_by = 'review_count',
      direction = 'desc',
      limit = 40,
    },
    options: { db },
  }) => {
    let query = db
      .selectFrom('accommodation')
      .innerJoin('address', 'address.id', 'accommodation.address_id')
      .innerJoin('city', 'city.id', 'address.city_id')
      .innerJoin('province', 'province.id', 'city.province_id')
      .innerJoin('country', 'country.id', 'province.country_id')

      .innerJoin(
        'accommodation_type',
        'accommodation.accommodation_type_id',
        'accommodation_type.id'
      )
      .leftJoin(
        'accommodation_review',
        'accommodation_review.accommodation_id',
        'accommodation.id'
      )
      .select((eb) => [
        'accommodation.id',
        'accommodation.name',
        'accommodation.description',
        'accommodation_type.name as accommodation_type',
        'accommodation_type.id as accommodation_type_id',
        'accommodation.number_of_bathrooms',
        'accommodation.number_of_bedrooms',
        'accommodation.square_meters',

        // Location.
        'country.name as country',
        'country.id as country_id',
        'province.name as province',
        'province.id as province_id',
        'city.name as city',
        'city.id as city_id',

        // Beach.
        'accommodation.distance_to_beach',
        eb('accommodation.distance_to_beach', '<=', 500).as('is_near_beach'),

        // Ratings.
        eb.fn
          .avg('accommodation_review.accuracy_rating')
          .as('avg_accuracy_rating'),
        eb.fn
          .avg('accommodation_review.cleanliness_rating')
          .as('avg_cleanliness_rating'),
        eb.fn
          .avg('accommodation_review.communication_rating')
          .as('avg_communication_rating'),
        eb.fn.avg('accommodation_review.value_rating').as('avg_value_rating'),

        // Reviews.
        eb.fn.count('accommodation_review.id').as('review_count'),

        // Images.
        withAccommodationImages(eb).as('accommodation_images'),

        // Metadata.
        withAccommodationCertifications(eb).as('accommodation_certifications'),
        withAccommodationAccessibilities(eb).as(
          'accommodation_accessibilities'
        ),
        withAccommodationFacilities(eb).as('accommodation_facilities'),
        withRoomAccessibilities(eb).as('room_accessibilities'),
        withRoomFacilities(eb).as('room_facilities'),
      ])
      .groupBy([
        'accommodation.id',
        'accommodation_type.name',
        'accommodation_type.id',
        'country.name',
        'country.id',
        'province.name',
        'province.id',
        'city.name',
        'city.id',
      ])
      .orderBy(order_by, direction);

    if (keyword != null && keyword.length >= 2) {
      const exp = `%${keyword.trim()}%`;
      query = query.where((eb) =>
        eb('city.name', 'ilike', exp)
          .or('accommodation.description', 'ilike', exp)
          .or('accommodation.name', 'ilike', exp)
          .or('country.name', 'ilike', exp)
          .or('province.name', 'ilike', exp)
      );
    }

    if (country_ids.length > 0) {
      query = query.where('country.id', 'in', country_ids);
    }

    if (accommodation_type_ids.length > 0) {
      query = query.where(
        'accommodation_type.id',
        'in',
        accommodation_type_ids
      );
    }

    if (accommodation_certification_ids.length > 0) {
      query = query
        .leftJoin(
          'accommodation_accommodation_certification',
          'accommodation_accommodation_certification.accommodation_id',
          'accommodation.id'
        )
        .leftJoin(
          'accommodation_certification',
          'accommodation_accommodation_certification.accommodation_certification_id',
          'accommodation_certification.id'
        )
        .where(
          'accommodation_certification.id',
          'in',
          accommodation_certification_ids
        );
    }

    if (accommodation_accessibility_ids.length > 0) {
      query = query
        .leftJoin(
          'accommodation_accommodation_accessibility',
          'accommodation_accommodation_accessibility.accommodation_id',
          'accommodation.id'
        )
        .leftJoin(
          'accommodation_accessibility',
          'accommodation_accommodation_accessibility.accommodation_accessibility_id',
          'accommodation_accessibility.id'
        )
        .where(
          'accommodation_accessibility.id',
          'in',
          accommodation_accessibility_ids
        );
    }

    //   accommodation_facility_ids = [],
    //   accommodation_type_ids = [],
    //   room_accessibility_ids = [],
    //   room_facility_ids = [],

    if (max_distance_to_beach != null) {
      query = query.where(
        'accommodation.distance_to_beach',
        '<=',
        max_distance_to_beach
      );
    }

    const accommodations = await query.limit(limit).execute();

    return {
      count: accommodations.length,
      accommodations: accommodations.map((accommodation) => {
        const {
          accommodation_certifications,
          accommodation_accessibilities,
          accommodation_facilities,
          room_accessibilities,
          room_facilities,

          avg_communication_rating,
          avg_cleanliness_rating,
          avg_accuracy_rating,
          avg_value_rating,

          review_count,
          ...rest
        } = accommodation;

        return {
          ...rest,

          review_count: Number(review_count),

          // Ratings.
          avg_communication_rating: rating(avg_communication_rating),
          avg_cleanliness_rating: rating(avg_cleanliness_rating),
          avg_accuracy_rating: rating(avg_accuracy_rating),
          avg_value_rating: rating(avg_value_rating),

          // Metadata.
          accommodation_certification_ids: accommodation_certifications.map(
            (it) => it.id
          ),
          accommodation_accessiblity_ids: accommodation_accessibilities.map(
            (it) => it.id
          ),
          accommodation_facility_ids: accommodation_accessibilities.map(
            (it) => it.id
          ),
          room_accessiblity_ids: accommodation_accessibilities.map(
            (it) => it.id
          ),
          room_facility_ids: accommodation_accessibilities.map((it) => it.id),
        };
      }),
    };
  },
});

function rating(value: string | number | undefined) {
  return value != null ? Number(value) : null;
}
