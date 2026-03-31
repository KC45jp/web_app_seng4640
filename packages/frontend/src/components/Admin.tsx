import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AdminCreateManagerInput } from "@seng4640/shared";
import {
  createManager,
  deleteManager,
  fetchProductOwners as fetchManagers,
} from "@/api/admin";
import { useAuthStore } from "@/store/authStore";
import { getApiErrorMessage } from "@/utils/apiError";

type ManagerFormValues = {
  name: string;
  email: string;
  password: string;
};

function createEmptyManagerForm(): ManagerFormValues {
  return {
    name: "",
    email: "",
    password: "",
  };
}

function parseManagerForm(values: ManagerFormValues):
  | { input: AdminCreateManagerInput; error: null }
  | { input: null; error: string } {
  if (!values.name.trim()) {
    return { input: null, error: "Manager name is required." };
  }

  if (!values.email.trim()) {
    return { input: null, error: "Email is required." };
  }

  if (!values.password.trim()) {
    return { input: null, error: "Password is required." };
  }

  if (values.password.trim().length < 8) {
    return { input: null, error: "Password must be at least 8 characters." };
  }

  return {
    input: {
      name: values.name.trim(),
      email: values.email.trim(),
      password: values.password,
    },
    error: null,
  };
}

export function AdminManagersPage() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [formValues, setFormValues] = useState<ManagerFormValues>(createEmptyManagerForm());
  const [formError, setFormError] = useState<string | null>(null);

  const {
    data: managers = [],
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: ["admin-managers"],
    queryFn: () => fetchManagers(token),
  });

  const createMutation = useMutation({
    mutationFn: (input: AdminCreateManagerInput) => createManager(token, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-managers"] });
      setFormValues(createEmptyManagerForm());
      setFormError(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (managerId: string) => deleteManager(token, managerId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-managers"] });
    },
  });

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const visibleManagers = managers.filter((manager) => {
    if (!normalizedQuery) {
      return true;
    }

    return `${manager.name} ${manager.email}`.toLowerCase().includes(normalizedQuery);
  });

  if (isPending) {
    return (
      <section className="page-card">
        <h1>Admin Dashboard</h1>
        <p>Loading...</p>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="page-card">
        <h1>Admin Dashboard</h1>
        <p className="search-error">{getApiErrorMessage(error, "Failed to load managers.")}</p>
      </section>
    );
  }

  return (
    <div className="admin-page-layout">
      <section className="page-card admin-hero-card">
        <div className="manager-page-header">
          <div>
            <h1>Admin Dashboard</h1>
            <p>Manage Product Manager accounts, create new manager access, and remove stale accounts.</p>
          </div>
        </div>
      </section>

      <section className="admin-summary-grid">
        <div className="manager-summary-card">
          <span className="manager-summary-label">Total Managers</span>
          <strong>{managers.length}</strong>
        </div>
        <div className="manager-summary-card">
          <span className="manager-summary-label">Visible Results</span>
          <strong>{visibleManagers.length}</strong>
        </div>
      </section>

      <div className="admin-content-layout">
        <section className="page-card">
          <div className="mypage-orders-header">
            <div>
              <h2 className="manager-section-title">Managers</h2>
              <p className="muted">Search by manager name or email.</p>
            </div>
          </div>

          <div className="admin-toolbar">
            <label className="mypage-filter">
              <span className="mypage-filter-label">Search</span>
              <input
                className="mypage-input"
                value={searchQuery}
                placeholder="Search by name or email"
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </label>
          </div>

          {visibleManagers.length === 0 ? (
            <div className="admin-empty-state">
              <h3>No managers found</h3>
              <p>Try a different search or create a new Product Manager account.</p>
            </div>
          ) : (
            <div className="admin-manager-list">
              {visibleManagers.map((manager) => (
                <article className="admin-manager-row" key={manager.id}>
                  <div className="admin-manager-main">
                    <div>
                      <p className="product-card-category">{manager.role}</p>
                      <h3 className="admin-manager-name">{manager.name}</h3>
                    </div>
                    <p className="admin-manager-email">{manager.email}</p>
                  </div>

                  <button
                    className="manager-danger-button"
                    type="button"
                    disabled={deleteMutation.isPending}
                    onClick={() => {
                      const confirmed = window.confirm(
                        `Delete manager ${manager.name}? This cannot be undone.`,
                      );

                      if (!confirmed) {
                        return;
                      }

                      deleteMutation.mutate(manager.id);
                    }}
                  >
                    {deleteMutation.isPending && deleteMutation.variables === manager.id
                      ? "Deleting..."
                      : "Delete"}
                  </button>
                </article>
              ))}
            </div>
          )}

          {deleteMutation.isError ? (
            <p className="search-error">
              {getApiErrorMessage(deleteMutation.error, "Failed to delete manager.")}
            </p>
          ) : null}
        </section>

        <aside className="page-card admin-form-card">
          <h2 className="manager-section-title">Create Manager</h2>
          <p className="muted">This will create a Product Manager account with manager role access.</p>

          <form
            className="admin-create-form"
            onSubmit={(event) => {
              event.preventDefault();
              setFormError(null);

              const parsed = parseManagerForm(formValues);
              if (!parsed.input) {
                setFormError(parsed.error);
                return;
              }

              createMutation.mutate(parsed.input);
            }}
          >
            <label className="manager-field">
              <span>Name</span>
              <input
                className="manager-input"
                value={formValues.name}
                disabled={createMutation.isPending}
                onChange={(event) => {
                  setFormValues((current) => ({ ...current, name: event.target.value }));
                  if (formError) setFormError(null);
                }}
              />
            </label>

            <label className="manager-field">
              <span>Email</span>
              <input
                className="manager-input"
                type="email"
                value={formValues.email}
                disabled={createMutation.isPending}
                onChange={(event) => {
                  setFormValues((current) => ({ ...current, email: event.target.value }));
                  if (formError) setFormError(null);
                }}
              />
            </label>

            <label className="manager-field">
              <span>Password</span>
              <input
                className="manager-input"
                type="password"
                value={formValues.password}
                disabled={createMutation.isPending}
                onChange={(event) => {
                  setFormValues((current) => ({ ...current, password: event.target.value }));
                  if (formError) setFormError(null);
                }}
              />
            </label>

            {formError ? <p className="search-error">{formError}</p> : null}
            {createMutation.isError ? (
              <p className="search-error">
                {getApiErrorMessage(createMutation.error, "Failed to create manager.")}
              </p>
            ) : null}

            <div className="button-row">
              <button className="btn-primary" type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create Manager"}
              </button>
            </div>
          </form>
        </aside>
      </div>
    </div>
  );
}
