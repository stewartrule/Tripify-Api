import type { Insertable } from 'kysely';

import type {
  Accommodation,
  AccommodationAccessibility,
  AccommodationFacility,
  AccommodationImage,
  AccommodationReview,
  AccommodationType,
  Address,
  Airline,
  Airplane,
  AirplaneSeat,
  Airport,
  City,
  Country,
  CountryImage,
  Event,
  Flight,
  Gate,
  Guest,
  Image,
  Passenger,
  Payment,
  Person,
  Profile,
  Province,
  Room,
  RoomAccessibility,
  RoomFacility,
  RoomPrice,
  Trip,
} from './generated.js';

// Insertable.
export type NewAccommodation = Insertable<Accommodation>;
export type NewAccommodationAccessibility =
  Insertable<AccommodationAccessibility>;
export type NewAccommodationFacility = Insertable<AccommodationFacility>;
export type NewAccommodationImage = Insertable<AccommodationImage>;
export type NewAccommodationReview = Insertable<AccommodationReview>;
export type NewAccommodationType = Insertable<AccommodationType>;
export type NewAddress = Insertable<Address>;
export type NewAirline = Insertable<Airline>;
export type NewAirplane = Insertable<Airplane>;
export type NewAirplaneSeat = Insertable<AirplaneSeat>;
export type NewAirport = Insertable<Airport>;
export type NewCity = Insertable<City>;
export type NewCountry = Insertable<Country>;
export type NewCountryImage = Insertable<CountryImage>;
export type NewEvent = Insertable<Event>;
export type NewFlight = Insertable<Flight>;
export type NewGate = Insertable<Gate>;
export type NewGuest = Insertable<Guest>;
export type NewImage = Insertable<Image>;
export type NewPassenger = Insertable<Passenger>;
export type NewPayment = Insertable<Payment>;
export type NewPerson = Insertable<Person>;
export type NewProfile = Insertable<Profile>;
export type NewProvince = Insertable<Province>;
export type NewRoom = Insertable<Room>;
export type NewRoomAccessibility = Insertable<RoomAccessibility>;
export type NewRoomFacility = Insertable<RoomFacility>;
export type NewRoomPrice = Insertable<RoomPrice>;
export type NewTrip = Insertable<Trip>;
