export function toSqlUtc(date: Date) {
  return date
    .toISOString()
    .replace('T', ' ')
    .replace('Z', '')
    .replace(/\.\d+$/, '');
}
