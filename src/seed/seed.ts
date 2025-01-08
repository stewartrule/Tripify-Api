import { seedAccommodations } from './seedAccommodations';
import { seedAirports } from './seedAirports';
import { seedCities } from './seedCities';
import { seedCountries } from './seedCountries';
import { seedEvents } from './seedEvents';
import { seedFlights } from './seedFlights';
import { seedProfiles } from './seedProfiles';
import { seedReviews } from './seedReviews';

async function seed() {
  // Shared.
  const countries = await seedCountries();
  console.log(`inserted ${countries.length} countries`);
  const safeCountries = countries.filter((country) => country.risk <= 2);

  const cities = await seedCities(safeCountries);
  console.log(`inserted ${cities.length} cities`);

  const profiles = await seedProfiles(cities);
  console.log(`inserted ${profiles.length} profiles`);

  // Accommodations.
  const accommodations = await seedAccommodations(safeCountries);
  console.log(`inserted ${accommodations.length} accommodations`);

  const reviewIds = await seedReviews(accommodations, profiles);
  console.log(`inserted ${reviewIds.length} reviews`);

  // Events.
  const eventIds = await seedEvents(cities);
  console.log(`inserted ${eventIds.length} events`);

  // Flights.
  const airports = await seedAirports(safeCountries);
  console.log(`inserted ${airports.length} airports`);

  const flights = await seedFlights(airports, safeCountries);
  console.log(`inserted ${flights.length} flights`);
}

seed();
