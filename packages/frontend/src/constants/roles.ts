// Keep runtime role constants local in frontend for now.
// TODO: Replace this with @seng4640/shared UserRole after shared supports dual ESM/CJS runtime exports.
export const ROLE = {
  GUEST: "guest",
  CUSTOMER: "customer",
  MANAGER: "manager",
  ADMIN: "admin",
} as const;
