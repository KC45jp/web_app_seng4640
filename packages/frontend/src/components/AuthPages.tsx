import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { PersistedUserRoleValue } from "@seng4640/shared";
import { ROLE } from "@/constants/roles";
import { useAuthStore } from "@/store/authStore";
import axios from "axios";
import { login, register } from "@/api/auth";


// type LoginPanelProps = {
//   title: string;
//   description: string;
//   options: { label: string; role: PersistedUserRoleValue; nextPath: string }[];
// };

function nextPathForRole(role: PersistedUserRoleValue) {
  switch (role) {
    case "customer":
      return "/mypage";
    case "manager":
      return "/pm/dashboard";
    case "admin":
      return "/admin/managers";
  }
}


function LoginScreen({ title, description }: { title: string; description: string }) {
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const result = await login({ email, password });

      const role = result.user.role;

      if (role === ROLE.GUEST) {
        setError("Invalid user role.");
        return;
      }
      
      setSession({
        role: role,
        token: result.accessToken,
      });
      navigate(nextPathForRole(role), { replace: true });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        setError("Invalid e-mail or Password");
      } else {
        setError("failed to login");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="page-card">
      <h1>{title}</h1>
      <p>{description}</p>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          minLength={8}
          required
        />
        {error ? <p className="muted">{error}</p> : null}
        <button type="submit" disabled={submitting}>
          {submitting ? "Logging in..." : "Login"}
        </button>
      </form>
    </section>
  );
}

export function LoginPage() {
  return <LoginScreen title="Login" description="Customer / Manager / Admin login" />;
}

export function ManagerLoginPage() {
  return <LoginScreen title="Manager Login" description="Product Manager login" />;
}

export function AdminLoginPage() {
  return <LoginScreen title="Admin Login" description="Super Admin login" />;
}

export function SignupPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);
  const [name, setName] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const result = await register({ name, email, password });


      const role = result.user.role;

      if (role !== ROLE.CUSTOMER) {
        setError("Invalid user role.");
        return;
      }
      
      setSession({
        role: role,
        token: result.accessToken,
      });
      navigate(nextPathForRole(role), { replace: true });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        setError("Invalid e-mail or Password");
      } else {
        setError("failed to login");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="page-card">
      <h1>Registration</h1>
      <form onSubmit={handleSubmit}>
        <input
        value={name}
        onChange={(e)=>setName(e.target.value)}
        placeholder="Your Name"
        required
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          minLength={8}
          required
        />
        {error ? <p className="muted">{error}</p> : null}
        <button type="submit" disabled={submitting}>
          {submitting ? "Logging in..." : "Login"}
        </button>
      </form>
    </section>
  );
}
