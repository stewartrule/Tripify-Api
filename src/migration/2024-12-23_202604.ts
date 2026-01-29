import { Kysely, sql } from 'kysely';
import { pivot } from '../db/util.js';

export async function up(db: Kysely<any>): Promise<void> {
  // Image.
  await db.schema
    .createTable('image')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('name', 'varchar', (col) => col.notNull())
    .addColumn('src', 'varchar', (col) => col.notNull())
    .addColumn('h', 'int2', (col) => col.notNull())
    .addColumn('s', 'int2', (col) => col.notNull())
    .addColumn('b', 'int2', (col) => col.notNull())
    .execute();

  // Locale.
  await db.schema
    .createTable('locale')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('name', 'varchar', (col) => col.notNull())
    .execute();

  // Country.
  await db.schema
    .createTable('country')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('name', 'varchar', (col) => col.notNull())
    .addColumn('native_name', 'varchar', (col) => col.notNull())
    .addColumn('code', 'varchar', (col) => col.notNull())
    .addColumn('locales', 'varchar', (col) => col.notNull())
    .addColumn('risk', 'int2', (col) => col.notNull())
    .execute();

  // Country images.
  await pivot(db, 'country', 'image');

  // Province.
  await db.schema
    .createTable('province')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('name', 'varchar', (col) => col.notNull())
    .addColumn('country_id', 'integer', (col) =>
      col.references('country.id').onDelete('cascade').notNull()
    )
    .execute();

  // City.
  await db.schema
    .createTable('city')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('name', 'varchar', (col) => col.notNull())
    .addColumn('latitude', 'float8', (col) => col.notNull())
    .addColumn('longitude', 'float8', (col) => col.notNull())
    .addColumn('province_id', 'integer', (col) =>
      col.references('province.id').onDelete('cascade').notNull()
    )
    .execute();

  // Accommodation facility.
  await db.schema
    .createTable('accommodation_facility')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('name', 'varchar', (col) => col.notNull())
    .execute();

  // Accommodation accessibility.
  await db.schema
    .createTable('accommodation_accessibility')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('name', 'varchar', (col) => col.notNull())
    .execute();

  // Room facility.
  await db.schema
    .createTable('room_facility')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('name', 'varchar', (col) => col.notNull())
    .execute();

  // Room accessibility.
  await db.schema
    .createTable('room_accessibility')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('name', 'varchar', (col) => col.notNull())
    .execute();

  // Airport.
  await db.schema
    .createTable('airport')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('name', 'varchar', (col) => col.notNull())
    .addColumn('iata', 'varchar', (col) => col.notNull())
    .addColumn('icao', 'varchar', (col) => col.notNull())
    .addColumn('lanes', 'int2', (col) => col.notNull())
    .addColumn('latitude', 'float8', (col) => col.notNull())
    .addColumn('longitude', 'float8', (col) => col.notNull())
    .addColumn('country_id', 'integer', (col) =>
      col.references('country.id').onDelete('cascade').notNull()
    )
    .execute();

  // Airplane.
  await db.schema
    .createTable('airplane')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('name', 'varchar', (col) => col.notNull())
    .addColumn('has_wifi', 'boolean', (col) => col.notNull().defaultTo(false))
    .addColumn('has_usb', 'boolean', (col) => col.notNull().defaultTo(false))
    .addColumn('has_entertainment', 'boolean', (col) =>
      col.notNull().defaultTo(false)
    )
    .execute();

  // Airline.
  await db.schema
    .createTable('airline')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('name', 'varchar', (col) => col.notNull())
    .addColumn('logo_src', 'varchar', (col) => col.notNull())
    .addColumn('country_id', 'integer', (col) =>
      col.references('country.id').onDelete('cascade').notNull()
    )
    .execute();

  // Airport gate.
  await db.schema
    .createTable('gate')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('airport_id', 'integer', (col) =>
      col.references('airport.id').onDelete('cascade').notNull()
    )
    .addColumn('terminal', 'char', (col) => col.notNull())
    .addColumn('gate', 'int2', (col) => col.notNull())
    .execute();

  await db.schema
    .createIndex('gate_unique')
    .on('gate')
    .columns(['airport_id', 'terminal', 'gate'])
    .unique()
    .execute();

  // Flight.
  await db.schema
    .createTable('flight')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('airline_id', 'integer', (col) =>
      col.references('airline.id').onDelete('cascade').notNull()
    )
    .addColumn('airplane_id', 'integer', (col) =>
      col.references('airplane.id').onDelete('cascade').notNull()
    )

    // Departure.
    .addColumn('departure_gate_id', 'integer', (col) =>
      col.references('gate.id').onDelete('no action').notNull()
    )
    .addColumn('departure_planned_at', 'timestamp', (col) => col.notNull())
    .addColumn('departed_at', 'timestamp')

    // Arrival.
    .addColumn('arrival_gate_id', 'integer', (col) =>
      col.references('gate.id').onDelete('no action').notNull()
    )
    .addColumn('arrival_planned_at', 'timestamp', (col) => col.notNull())
    .addColumn('arrived_at', 'timestamp')

    // Other
    .addColumn('cancelled_at', 'timestamp')
    .addColumn('free_meals', 'int2', (col) => col.defaultTo(0))
    .execute();

  // Address.
  await db.schema
    .createTable('address')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('street', 'varchar', (col) => col.notNull())
    .addColumn('house_number', 'int4', (col) => col.notNull())
    .addColumn('postal_code', 'varchar', (col) => col.notNull())
    .addColumn('city_id', 'integer', (col) =>
      col.references('city.id').onDelete('cascade').notNull()
    )
    .execute();

  // Gender.
  await db.schema.createType('gender').asEnum(['m', 'f', 'x']).execute();

  // Person.
  await db.schema
    .createTable('person')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('first_name', 'varchar', (col) => col.notNull())
    .addColumn('last_name', 'varchar', (col) => col.notNull())
    .addColumn('date_of_birth', 'date')
    .addColumn('telephone', 'varchar')
    .addColumn('email', 'varchar', (col) => col.notNull())
    .addColumn('gender', sql`gender`, (col) => col.notNull())
    .addColumn('address_id', 'integer', (col) =>
      col.references('address.id').onDelete('no action').notNull()
    )
    .addColumn('created_at', 'timestamp', (col) =>
      col.notNull().defaultTo(sql`timezone('utc', now())`)
    )
    .execute();

  // Login.
  await db.schema
    .createTable('login')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('profile_id', 'integer', (col) =>
      col.references('profile.id').onDelete('no action').notNull()
    )
    .addColumn('created_at', 'timestamp', (col) =>
      col.notNull().defaultTo(sql`timezone('utc', now())`)
    );

  // Profile.
  await db.schema
    .createTable('profile')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('password', 'varchar', (col) => col.notNull())
    .addColumn('email', 'varchar', (col) => col.notNull())
    .addColumn('person_id', 'integer', (col) =>
      col.references('person.id').onDelete('no action').notNull()
    )
    .addColumn('image_id', 'integer', (col) =>
      col.references('image.id').onDelete('no action').notNull()
    )
    .addColumn('created_at', 'timestamp', (col) =>
      col.notNull().defaultTo(sql`timezone('utc', now())`)
    )
    .execute();

  // Airplane seat type
  await db.schema
    .createType('airplane_seat_type')
    .asEnum(['first', 'business', 'economy'])
    .execute();

  // Airplane seat.
  await db.schema
    .createTable('airplane_seat')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('airplane_id', 'integer', (col) =>
      col.references('airplane.id').onDelete('no action').notNull()
    )
    .addColumn('type', sql`airplane_seat_type`, (col) => col.notNull())
    .addColumn('exit_row', 'boolean', (col) => col.defaultTo(false))
    .addColumn('bulkhead', 'boolean', (col) => col.defaultTo(false))
    .addColumn('row', 'int2', (col) => col.notNull())
    .addColumn('seat', 'char', (col) => col.notNull()) // A,B,C - D,E,F
    .execute();

  await db.schema
    .createTable('payment_method')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('name', 'varchar', (col) => col.notNull())
    .execute();

  // Payment.
  await db.schema
    .createTable('payment')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('profile_id', 'integer', (col) =>
      col.references('profile.id').onDelete('no action').notNull()
    )
    .addColumn('payment_method_id', 'integer', (col) =>
      col.references('payment_method.id').onDelete('no action').notNull()
    )
    .addColumn('transaction_id', 'varchar', (col) => col.notNull())
    .addColumn('merchant_id', 'varchar', (col) => col.notNull())
    .addColumn('amount', 'integer', (col) => col.notNull())
    .addColumn('payed_at', 'timestamp', (col) => col.notNull())
    .execute();

  // Trip.
  await db.schema
    .createType('trip_type')
    .asEnum(['one_way', 'round_trip'])
    .execute();

  await db.schema
    .createTable('trip')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('profile_id', 'integer', (col) =>
      col.references('profile.id').onDelete('no action').notNull()
    )
    .addColumn('payment_id', 'integer', (col) =>
      col.references('payment.id').onDelete('no action').notNull()
    )
    .addColumn('booked_at', 'timestamp', (col) => col.notNull())
    .addColumn('type', sql`trip_type`, (col) => col.notNull())
    .execute();

  // Passenger.
  await db.schema
    .createTable('passenger')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('trip_id', 'integer', (col) =>
      col.references('trip.id').onDelete('no action').notNull()
    )
    .addColumn('flight_id', 'integer', (col) =>
      col.references('flight.id').onDelete('no action').notNull()
    )
    .addColumn('person_id', 'integer', (col) =>
      col.references('person.id').onDelete('no action').notNull()
    )
    .addColumn('airplane_seat_id', 'integer', (col) =>
      col.references('airplane_seat.id').onDelete('no action').notNull()
    )
    .addColumn('checked_in_at', 'timestamp')
    .addColumn('boarded_at', 'timestamp')
    .addColumn('return_flight', 'boolean', (col) =>
      col.notNull().defaultTo(false)
    )
    .execute();

  // Leisure.
  await db.schema
    .createTable('leisure')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('name', 'varchar', (col) => col.notNull())
    .execute();

  await pivot(db, 'leisure', 'image');

  // Accommodation certification.
  await db.schema
    .createTable('accommodation_certification')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('name', 'varchar', (col) => col.notNull())
    .execute();

  // Accommodation type.
  await db.schema
    .createTable('accommodation_type')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('name', 'varchar', (col) => col.notNull())
    .execute();

  // Accommodation.
  await db.schema
    .createTable('accommodation')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('name', 'varchar', (col) => col.notNull())
    .addColumn('description', 'varchar', (col) => col.notNull())
    .addColumn('distance_to_beach', 'int4', (col) => col.notNull().defaultTo(0))
    .addColumn('address_id', 'integer', (col) =>
      col.references('address.id').onDelete('cascade').notNull()
    )
    .addColumn('accommodation_type_id', 'integer', (col) =>
      col.references('accommodation_type.id').onDelete('cascade').notNull()
    )
    .execute();

  await pivot(db, 'accommodation', 'leisure');
  await pivot(db, 'accommodation', 'accommodation_accessibility');
  await pivot(db, 'accommodation', 'accommodation_facility');
  await pivot(db, 'accommodation', 'accommodation_certification');
  await pivot(db, 'accommodation', 'image');

  // Room.
  await db.schema
    .createTable('room')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('floor', 'int2', (col) => col.defaultTo(0))
    .addColumn('number', 'int2', (col) => col.notNull())
    .addColumn('number_of_bedrooms', 'int2', (col) => col.notNull())
    .addColumn('number_of_bathrooms', 'int2', (col) => col.notNull())
    .addColumn('square_meters', 'int2', (col) => col.notNull())
    .execute();

  // Room price.
  await db.schema
    .createTable('room_price')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('room_id', 'integer', (col) =>
      col.references('room.id').onDelete('cascade').notNull()
    )
    .addColumn('price', 'int4', (col) => col.notNull())
    .addColumn('week', 'int2', (col) => col.notNull())
    .execute();

  await pivot(db, 'accommodation', 'room');
  await pivot(db, 'room', 'room_accessibility');
  await pivot(db, 'room', 'room_facility');

  // Guest.
  await db.schema
    .createTable('guest')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('person_id', 'integer', (col) =>
      col.references('person.id').onDelete('no action').notNull()
    )
    .addColumn('accommodation_id', 'integer', (col) =>
      col.references('accommodation.id').onDelete('no action').notNull()
    )
    .addColumn('from_date', 'timestamp', (col) => col.notNull())
    .addColumn('to_date', 'timestamp', (col) => col.notNull())
    .execute();

  // Accommodation review.
  await db.schema
    .createTable('accommodation_review')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('accommodation_id', 'integer', (col) =>
      col.references('accommodation.id').onDelete('cascade').notNull()
    )
    .addColumn('profile_id', 'integer', (col) =>
      col.references('profile.id').onDelete('cascade').notNull()
    )
    .addColumn('cleanliness_rating', 'int2', (col) => col.notNull())
    .addColumn('accuracy_rating', 'int2', (col) => col.notNull())
    .addColumn('communication_rating', 'int2', (col) => col.notNull())
    .addColumn('value_rating', 'int2', (col) => col.notNull())
    .addColumn('review', 'varchar', (col) => col.notNull())
    .addColumn('created_at', 'timestamp', (col) =>
      col.notNull().defaultTo(sql`timezone('utc', now())`)
    )
    .execute();

  // Events.
  await db.schema
    .createTable('event')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('name', 'varchar', (col) => col.notNull())
    .addColumn('description', 'varchar', (col) => col.notNull())
    .addColumn('price', 'integer', (col) => col.notNull())
    .addColumn('leisure_id', 'integer', (col) =>
      col.references('leisure.id').onDelete('cascade').notNull()
    )
    .addColumn('address_id', 'integer', (col) =>
      col.references('address.id').onDelete('cascade').notNull()
    )
    .addColumn('image_id', 'integer', (col) =>
      col.references('image.id').onDelete('cascade').notNull()
    )
    .addColumn('from_date', 'timestamp', (col) => col.notNull())
    .addColumn('to_date', 'timestamp', (col) => col.notNull())
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  //
}
