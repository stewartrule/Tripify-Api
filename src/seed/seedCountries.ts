import { db } from '../db';
import { countryData } from './scraped/countryData';
import { locales } from './scraped/locales';
import { travelRisk } from '../util/travelRisk';

const moderate = ['Italy'];
const medium = ['Russia', 'Colombia', 'Thailand'];
const high = ['Haiti', 'Mexico', 'Venezuela', 'Belarus', 'Papua New Guinea'];
const extreme = [
  'Afghanistan',
  'Burkina Faso',
  'Iraq',
  'Libya',
  'Mali',
  'Myanmar',
  'Niger',
  'North Korea',
  'Pakistan',
  'Palestine',
  'Somalia',
  'South Sudan',
  'Syria',
  'Ukraine',
  'Yemen',
];

function getRisk(name: string) {
  if (extreme.includes(name)) {
    return travelRisk.extreme;
  }
  if (high.includes(name)) {
    return travelRisk.high;
  }
  if (medium.includes(name)) {
    return travelRisk.medium;
  }
  if (moderate.includes(name)) {
    return travelRisk.moderate;
  }
  return travelRisk.low;
}

function getLocale(countryName: string) {
  const exact = locales.find((locale) => locale.en_name === countryName);
  if (exact) {
    return exact;
  }

  return locales.find((locale) => locale.en_name.includes(countryName));
}

export async function seedCountries() {
  const countryNames = Array.from(
    new Set(countryData.map((data) => data.country))
  );

  const countries = await db
    .insertInto('country')
    .values(
      countryNames
        .map((name) => {
          const locale = getLocale(name);
          if (!locale) {
            console.log('Missing locale for', name);
          }
          return {
            name,
            risk: getRisk(name),
            native_name: locale?.native_name || name,
            code: locale?.country || '_',
            locales: locale?.locales || '_',
          };
        })
        .filter((it) => it.code !== '_')
    )
    .returningAll()
    .execute();

  for (const country of countries) {
    const images = await db
      .insertInto('image')
      .values(
        countryData
          .filter((data) => data.country === country.name)
          .map(({ hsb, original_id, alt }) => ({
            h: hsb[0],
            s: hsb[1],
            b: hsb[2],
            src: `/images/country/${original_id}.webp`,
            name: alt,
          }))
      )
      .returning(['id', 'name'])
      .execute();

    await db
      .insertInto('country_image')
      .values(
        images.map((image) => ({ image_id: image.id, country_id: country.id }))
      )
      .execute();
  }

  return countries;
}
