import bcrypt from 'bcrypt';

export async function hash(rawPassword: string): Promise<string> {
  const salt = await bcrypt.genSalt(13);
  return bcrypt.hash(rawPassword, salt);
}

export async function verify(
  plainTextPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(plainTextPassword, hashedPassword);
}
