import { ExpressionBuilder } from 'kysely';
import { jsonArrayFrom } from 'kysely/helpers/postgres';
import { DB } from '../db/generated.js';

type EB = ExpressionBuilder<DB, 'room'>;

export function withRoomAccessibilities(eb: EB) {
  return jsonArrayFrom(
    eb
      .selectFrom('room_accessibility')
      .select(['room_accessibility.id', 'room_accessibility.name'])
      .innerJoin(
        'room_room_accessibility',
        'room_room_accessibility.room_id',
        'room.id'
      )
      .whereRef(
        'room_accessibility.id',
        '=',
        'room_room_accessibility.room_accessibility_id'
      )
  );
}

export function withRoomPrices(eb: EB) {
  return jsonArrayFrom(
    eb
      .selectFrom('room_price')
      .select(['room_price.price', 'room_price.week'])
      .whereRef('room_price.room_id', '=', 'room.id')
  );
}

export function withRoomFacilities(eb: EB) {
  return jsonArrayFrom(
    eb
      .selectFrom('room_facility')
      .select(['room_facility.id', 'room_facility.name'])
      .innerJoin('room_room_facility', 'room_room_facility.room_id', 'room.id')
      .whereRef('room_facility.id', '=', 'room_room_facility.room_facility_id')
  );
}
