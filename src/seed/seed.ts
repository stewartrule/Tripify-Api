import { seedAccommodations } from './seedAccommodations.js';
import { seedAirports } from './seedAirports.js';
import { seedCities } from './seedCities.js';
import { seedCountries } from './seedCountries.js';
import { seedEvents } from './seedEvents.js';
import { seedFlights } from './seedFlights.js';
import { seedPeople } from './seedPeople.js';
import { seedProfiles } from './seedProfiles.js';
import { seedReviews } from './seedReviews.js';

async function seed() {
  // Shared.
  const countries = await seedCountries();
  console.log(`inserted ${countries.length} countries`);
  const safeCountries = countries.filter((country) => country.risk <= 2);

  const cities = await seedCities(safeCountries);
  console.log(`inserted ${cities.length} cities`);

  const people = await seedPeople(cities);
  console.log(`inserted ${people.length} people`);

  const profiles = await seedProfiles(people);
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
