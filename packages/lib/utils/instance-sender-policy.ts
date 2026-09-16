/** Match verified sender addresses exactly; never admit lookalike domains. */
export const isAllowedInstanceSender = (email: string, domains: string, addresses: string): boolean => {
  const normalized = email.trim().toLowerCase();
  const parts = normalized.split('@');

  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return false;
  }

  const allowedDomains = domains
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  const allowedAddresses = addresses
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  return allowedAddresses.includes(normalized) || allowedDomains.includes(parts[1]);
};
