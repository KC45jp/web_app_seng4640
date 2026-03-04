import { useNavigate } from "react-router-dom";
import type { PersistedUserRoleValue } from "@seng4640/shared";
import { ROLE } from "@/constants/roles";
import { useAuthStore } from "@/store/authStore";

type LoginPanelProps = {
  title: string;
  description: string;
  options: { label: string; role: PersistedUserRoleValue; nextPath: string }[];
};

function LoginPanel({ title, description, options }: LoginPanelProps) {
  const loginAs = useAuthStore((state) => state.loginAs);
  const navigate = useNavigate();

  return (
    <section className="page-card">
      <h1>{title}</h1>
      <p>{description}</p>
      <div className="button-row">
        {options.map((option) => (
          <button
            key={option.label}
            onClick={() => {
              loginAs(option.role);
              navigate(option.nextPath);
            }}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>
    </section>
  );
}

export function LoginPage() {
  return (
    <LoginPanel
      description="Login page shell. API hookup comes later."
      options={[
        {
          label: "Login as Customer (mock)",
          role: ROLE.CUSTOMER,
          nextPath: "/mypage",
        },
        {
          label: "Login as Manager (mock)",
          role: ROLE.MANAGER,
          nextPath: "/pm/dashboard",
        },
        {
          label: "Login as Admin (mock)",
          role: ROLE.ADMIN,
          nextPath: "/admin/managers",
        },
      ]}
      title="Login"
    />
  );
}

export function SignupPage() {
  const loginAs = useAuthStore((state) => state.loginAs);
  const navigate = useNavigate();

  return (
    <section className="page-card">
      <h1>Sign up</h1>
      <p>Customer sign up page shell.</p>
      <button
        onClick={() => {
          loginAs(ROLE.CUSTOMER);
          navigate("/mypage");
        }}
        type="button"
      >
        Create customer account (mock)
      </button>
    </section>
  );
}

export function ManagerLoginPage() {
  return (
    <LoginPanel
      description="Product Manager login shell."
      options={[
        {
          label: "Login as Manager (mock)",
          role: ROLE.MANAGER,
          nextPath: "/pm/dashboard",
        },
      ]}
      title="Manager Login"
    />
  );
}

export function AdminLoginPage() {
  return (
    <LoginPanel
      description="Super Admin login shell."
      options={[
        {
          label: "Login as Admin (mock)",
          role: ROLE.ADMIN,
          nextPath: "/admin/managers",
        },
      ]}
      title="Admin Login"
    />
  );
}
