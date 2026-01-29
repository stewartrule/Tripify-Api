import { z } from 'zod';

export const v = {
  id() {
    return z
      .string()
      .max(10)
      .regex(/^[1-9]\d*$/)
      .transform((it) => parseInt(it, 10));
  },

  ids() {
    return z
      .string()
      .max(1024)
      .regex(/^[0-9\.]+$/)
      .transform((val) =>
        val
          .split(/\.+/g)
          .filter((it) => /^\d{1,10}$/.test(it))
          .map((it) => parseInt(it, 10))
      );
  },

  limit() {
    return z
      .string()
      .max(3)
      .regex(/^[1-9]\d*$/)
      .transform((it) => parseInt(it, 10))
      .refine((it) => it <= 200)
      .optional();
  },

  keyword() {
    return z
      .string()
      .normalize()
      .trim()
      .min(1)
      .max(128)
      .transform(
        (it) =>
          it
            .replace(/\s+/g, ' ') // Remove excessive whitespace.
            .replace(/\p{C}/gu, '') // Remove invisible control characters.
      );
  },

  sqlBool() {
    return z.union([z.boolean(), z.literal(0), z.literal(1)]);
  },
};
