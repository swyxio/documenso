import { z } from 'zod';

export const getDomainSignupOrganisation = (email: string, configuration: string): string | undefined => {
  const parts = email.trim().toLowerCase().split('@');

  if (!configuration || parts.length !== 2 || !parts[0] || !parts[1]) {
    return undefined;
  }

  const organisations = z.record(z.string().min(1)).parse(JSON.parse(configuration));

  return organisations[parts[1]];
};
