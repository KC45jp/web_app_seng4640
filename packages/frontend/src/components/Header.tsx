import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ROLE } from "@/constants/roles";
import { useAuthStore } from "@/store/authStore";

export function Header() {
  const navigate = useNavigate();
  const role = useAuthStore((state) => state.role);
  const logout = useAuthStore((state) => state.logout);
  const [keyword, setKeyword] = useState("");

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next = keyword.trim();

    if (next.length === 0) {
      navigate("/search");
      return;
    }

    navigate(`/search?q=${encodeURIComponent(next)}`);
  };

  return (
    <header className="app-header">
      <div className="header-inner">
        <form className="header-search" onSubmit={submitSearch}>
          <input
            aria-label="Search products"
            className="header-search-input"
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Search products"
            value={keyword}
          />
          <button className="header-search-button" type="submit">
            Search
          </button>
        </form>

        <nav aria-label="Global navigation" className="header-nav">
          {role === ROLE.GUEST && (
            <>
              <Link to="/login">Login</Link>
              <Link to="/signup">Sign up</Link>
            </>
          )}

          {role === ROLE.CUSTOMER && (
            <>
              <Link to="/mypage">My Page</Link>
              <button onClick={logout} type="button">
                Logout
              </button>
            </>
          )}

          {role === ROLE.MANAGER && (
            <>
              <Link to="/pm/dashboard">Manager Dashboard</Link>
              <button onClick={logout} type="button">
                Logout
              </button>
            </>
          )}

          {role === ROLE.ADMIN && (
            <>
              <Link to="/admin/managers">Admin Dashboard</Link>
              <button onClick={logout} type="button">
                Logout
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
