import { Navigate, Outlet, useLocation } from "react-router-dom";
import type { PersistedUserRoleValue } from "@seng4640/shared";
import { ROLE } from "@/constants/roles";
import { useAuthStore } from "@/store/authStore";

type RequireRoleProps = {
  roles: PersistedUserRoleValue[];
};

export function RequireRole({ roles }: RequireRoleProps) {
  const role = useAuthStore((state) => state.role);
  const location = useLocation();

  if (role === ROLE.GUEST) {
    return <Navigate replace state={{ from: location }} to="/login" />;
  }

  if (!roles.includes(role)) {
    return <Navigate replace to="/" />;
  }

  return <Outlet />;
}
