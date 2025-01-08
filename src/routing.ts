import { Routing, ServeStatic } from 'express-zod-api';
import * as path from 'path';
import { accommodationEndpoint } from './endpoint/accommodation';
import { accommodationFiltersEndpoint } from './endpoint/accommodationFilters';
import { accommodationsEndpoint } from './endpoint/accommodations';
import { countriesEndpoint } from './endpoint/countries';
import { eventEndpoint } from './endpoint/event';
import { eventsEndpoint } from './endpoint/events';
import { flightsEndpoint } from './endpoint/flights';
import { locationsEndpoint } from './endpoint/locations';
import { airportsEndpoint } from './endpoint/airports';

export const routing: Routing = {
  images: new ServeStatic(path.join(__dirname, 'images'), {
    dotfiles: 'deny',
    index: false,
    redirect: false,
  }),
  v1: {
    filters: {
      accommodations: accommodationFiltersEndpoint,
    },
    countries: countriesEndpoint,
    flights: flightsEndpoint,
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
