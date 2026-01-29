import { Routing, ServeStatic } from 'express-zod-api';
import * as path from 'path';
import { accommodationEndpoint } from './endpoint/accommodation.js';
import { accommodationFiltersEndpoint } from './endpoint/accommodationFilters.js';
import { accommodationsEndpoint } from './endpoint/accommodations.js';
import { airportsEndpoint } from './endpoint/airports.js';
import { countriesEndpoint } from './endpoint/countries.js';
import { eventEndpoint } from './endpoint/event.js';
import { eventsEndpoint } from './endpoint/events.js';
import { flightEndpoint } from './endpoint/flight.js';
import { flightsEndpoint } from './endpoint/flights.js';
import { locationsEndpoint } from './endpoint/locations.js';
import { meEndpoint } from './endpoint/me.js';

export const routing: Routing = {
  images: new ServeStatic(path.join(import.meta.dirname, 'images'), {
    dotfiles: 'deny',
    index: false,
    redirect: false,
  }),
  v1: {
    me: meEndpoint,
    filters: {
      accommodations: accommodationFiltersEndpoint,
    },
    countries: countriesEndpoint,
    flights: flightsEndpoint.nest({
      ':id': flightEndpoint,
    }),
    events: eventsEndpoint.nest({
      ':id': eventEndpoint,
    }),
    accommodations: accommodationsEndpoint.nest({
      ':id': accommodationEndpoint,
    }),
    locations: locationsEndpoint,
    airports: airportsEndpoint,
  },
};
