import { Kysely, sql } from 'kysely';
import { pivot } from '../db/util';

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

  // Country image.
  await db.schema
    .createTable('country_image')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('country_id', 'integer', (col) =>
      col.references('country.id').onDelete('cascade').notNull()
    )
    .addColumn('image_id', 'integer', (col) =>
      col.references('image.id').onDelete('cascade').notNull()
    )
    .execute();

  await db.schema
    .createIndex('country_image_unique_index')
    .on('country_image')
    .columns(['country_id', 'image_id'])
    .unique()
    .execute();

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
    .addColumn('lanes', 'int4', (col) => col.notNull())
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
    .addColumn('departure_airport_id', 'integer', (col) =>
      col.references('airport.id').onDelete('cascade').notNull()
    )
    .addColumn('planned_departure_at', 'timestamp', (col) => col.notNull())
    .addColumn('departure_at', 'timestamp')
    .addColumn('departure_gate', 'varchar', (col) => col.notNull())

    // Arrival.
    .addColumn('arrival_airport_id', 'integer', (col) =>
      col.references('airport.id').onDelete('cascade').notNull()
    )
    .addColumn('planned_arrival_at', 'timestamp', (col) => col.notNull())
    .addColumn('arrival_at', 'timestamp')
    .addColumn('arrival_gate', 'varchar', (col) => col.notNull())

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

  // Guest.
  await db.schema
    .createTable('guest')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('first_name', 'varchar', (col) => col.notNull())
    .addColumn('last_name', 'varchar', (col) => col.notNull())
    .addColumn('date_of_birth', 'timestamp')
    .execute();

  // Passenger.
  await db.schema
    .createTable('passenger')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('first_name', 'varchar', (col) => col.notNull())
    .addColumn('last_name', 'varchar', (col) => col.notNull())
    .addColumn('date_of_birth', 'timestamp')
    .execute();

  // Profile.
  await db.schema
    .createTable('profile')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('first_name', 'varchar', (col) => col.notNull())
    .addColumn('last_name', 'varchar', (col) => col.notNull())
    .addColumn('date_of_birth', 'timestamp')
    .addColumn('telephone', 'varchar')
    .addColumn('address_id', 'integer', (col) =>
      col.references('address.id').onDelete('no action').notNull()
    )
    .addColumn('image_id', 'integer', (col) =>
      col.references('image.id').onDelete('no action').notNull()
    )
    .execute();

  // Leisure.
  await db.schema
    .createTable('leisure')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('name', 'varchar', (col) => col.notNull())
    .execute();

  pivot(db, 'leisure', 'image');

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
    .addColumn('number_of_bedrooms', 'int2', (col) => col.notNull())
    .addColumn('number_of_bathrooms', 'int2', (col) => col.notNull())
    .addColumn('square_meters', 'int2', (col) => col.notNull())
    .addColumn('address_id', 'integer', (col) =>
      col.references('address.id').onDelete('cascade').notNull()
    )
    .addColumn('accommodation_type_id', 'integer', (col) =>
      col.references('accommodation_type.id').onDelete('cascade').notNull()
    )
    .execute();

  pivot(db, 'accommodation', 'leisure');
  pivot(db, 'accommodation', 'room_accessibility');
  pivot(db, 'accommodation', 'room_facility');
  pivot(db, 'accommodation', 'accommodation_accessibility');
  pivot(db, 'accommodation', 'accommodation_facility');
  pivot(db, 'accommodation', 'accommodation_certification');

  // Accommodation price.
  await db.schema
    .createTable('accommodation_price')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('accommodation_id', 'integer', (col) =>
      col.references('accommodation.id').onDelete('cascade').notNull()
    )
    .addColumn('price', 'int4', (col) => col.notNull())
    .addColumn('week', 'int2', (col) => col.notNull())
    .execute();

  // Accommodation image.
  await pivot(db, 'accommodation', 'image');

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
      col.notNull().defaultTo(sql`now()`)
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
    .addColumn('from_date', 'timestamp', (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn('to_date', 'timestamp', (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  //
}
