import createHttpError from 'http-errors';
import { z } from 'zod';
import {
  withAccommodationAccessibilities,
  withAccommodationAddress,
  withAccommodationCertifications,
  withAccommodationFacilities,
  withAccommodationImages,
  withAccommodationLeisures,
  withAccommodationPrices,
  withAccommodationReviews,
  withRoomAccessibilities,
  withRoomFacilities,
} from '../query/accommodation';
import { publicEndpointsFactory } from '../util/endpointsFactory';
import { v } from '../util/validator';

const accommodation = z.record(z.any());

const output = z.object({
  accommodation,
});

const input = z.object({
  id: v.id(),
});

export const accommodationEndpoint = publicEndpointsFactory.build({
  input,
  output,
  handler: async ({ input: { id }, options: { db } }) => {
    const accommodation = await db
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
      .select((eb) => [
        'accommodation.id',
        'accommodation.name',
        'accommodation.description',
        'accommodation_type.name as accommodation_type',
        'accommodation_type.id as accommodation_type_id',
        'country.name as country',
        'country.id as country_id',
        'province.name as province',
        'province.id as province_id',
        'city.name as city',
        'city.id as city_id',
        'accommodation.distance_to_beach',

        eb('distance_to_beach', '<=', 500).as('is_near_beach'),

        withAccommodationAddress(eb).as('accommodation_address'),
        withAccommodationCertifications(eb).as('accommodation_certifications'),
        withAccommodationLeisures(eb).as('accommodation_leisures'),
        withAccommodationPrices(eb).as('accommodation_prices'),
        withAccommodationReviews(eb).as('accommodation_reviews'),
        withAccommodationImages(eb).as('accommodation_images'),
        withAccommodationAccessibilities(eb).as(
          'accommodation_accessibilities'
        ),
        withAccommodationFacilities(eb).as('accommodation_facilities'),
        withRoomAccessibilities(eb).as('room_accessibilities'),
        withRoomFacilities(eb).as('room_facilities'),
      ])
      .where('accommodation.id', '=', id)
      .limit(1)
      .executeTakeFirst();

    if (!accommodation) {
      throw createHttpError(404);
    }

    return { accommodation };
  },
});
