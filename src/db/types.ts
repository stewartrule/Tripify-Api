import type { Insertable } from 'kysely';

import type {
  Accommodation,
  AccommodationAccessibility,
  AccommodationFacility,
  AccommodationImage,
  AccommodationPrice,
  AccommodationReview,
  AccommodationType,
  Address,
  Airline,
  Airplane,
  Airport,
  City,
  Country,
  CountryImage,
  Event,
  Flight,
  Guest,
  Image,
  Passenger,
  Profile,
  Province,
  RoomAccessibility,
  RoomFacility,
} from './generated';

// Insertable.
export type NewAccommodation = Insertable<Accommodation>;
export type NewAccommodationAccessibility =
  Insertable<AccommodationAccessibility>;
export type NewAccommodationFacility = Insertable<AccommodationFacility>;
export type NewAccommodationImage = Insertable<AccommodationImage>;
export type NewAccommodationReview = Insertable<AccommodationReview>;
export type NewAccommodationType = Insertable<AccommodationType>;
export type NewAccommodationPrice = Insertable<AccommodationPrice>;
export type NewAddress = Insertable<Address>;
export type NewAirline = Insertable<Airline>;
export type NewAirplane = Insertable<Airplane>;
export type NewAirport = Insertable<Airport>;
export type NewCity = Insertable<City>;
export type NewCountry = Insertable<Country>;
export type NewCountryImage = Insertable<CountryImage>;
export type NewEvent = Insertable<Event>;
export type NewFlight = Insertable<Flight>;
export type NewGuest = Insertable<Guest>;
export type NewImage = Insertable<Image>;
export type NewPassenger = Insertable<Passenger>;
export type NewProfile = Insertable<Profile>;
export type NewProvince = Insertable<Province>;
export type NewRoomAccessibility = Insertable<RoomAccessibility>;
export type NewRoomFacility = Insertable<RoomFacility>;
