"use client";

import { useEffect, useMemo, useState } from "react";
import { deleteJSON, getJSON, patchJSON, postJSON } from "../lib/http";

interface StaffMember {
  _id: string;
  email: string;
  name?: string;
  roles: string[];
  active: boolean;
  lastLoginAt?: string | null;
}

interface SystemConfig {
  maintenanceMode: boolean;
  submissionsOpen: boolean;
  announcement: string;
  supportEmail: string;
}

const ROLE_OPTIONS = ["admin", "moderator", "analyst"] as const;

interface StaffFormState {
  email: string;
  name: string;
  password: string;
  roles: string[];
  active: boolean;
}

const initialStaffForm: StaffFormState = {
  email: "",
  name: "",
  password: "",
  roles: ["moderator"],
  active: true
};

export function AdminDashboardClient() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [, setSystemConfig] = useState<SystemConfig | null>(null);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);
  const [isSavingStaff, setIsSavingStaff] = useState(false);
  const [staffForm, setStaffForm] = useState<StaffFormState>(initialStaffForm);
  const [staffMessage, setStaffMessage] = useState<string | null>(null);

  const [configDraft, setConfigDraft] = useState<SystemConfig | null>(null);
  const [configMessage, setConfigMessage] = useState<string | null>(null);
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  const [seedStatus, setSeedStatus] = useState<string | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);

  useEffect(() => {
    refreshStaff();
    refreshConfig();
  }, []);

  const staffSorted = useMemo(
    () =>
      [...staff].sort((a, b) =>
        a.email.localeCompare(b.email, undefined, { sensitivity: "base" })
      ),
    [staff]
  );

  async function refreshStaff() {
    setIsLoadingStaff(true);
    setStaffMessage(null);
    try {
      const data = await getJSON<StaffMember[]>("/api/staff");
      setStaff(data);
    } catch (error) {
      setStaffMessage(parseError(error));
    } finally {
      setIsLoadingStaff(false);
    }
  }

  async function refreshConfig() {
    setConfigMessage(null);
    try {
      const data = await getJSON<SystemConfig>("/api/system/config");
      setSystemConfig(data);
      setConfigDraft(data);
    } catch (error) {
      setConfigMessage(parseError(error));
    }
  }

  async function handleCreateStaff(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSavingStaff(true);
    setStaffMessage(null);
    try {
      await postJSON("/api/staff", {
        email: staffForm.email.trim().toLowerCase(),
        name: staffForm.name.trim(),
        password: staffForm.password,
        roles: staffForm.roles,
        active: staffForm.active
      });
      setStaffForm(initialStaffForm);
      setStaffMessage("Staff member created.");
      await refreshStaff();
    } catch (error) {
      setStaffMessage(parseError(error));
    } finally {
      setIsSavingStaff(false);
    }
  }

  async function toggleActive(member: StaffMember) {
    setStaffMessage(null);
    try {
      await patchJSON(`/api/staff/${member._id}`, { active: !member.active });
      await refreshStaff();
    } catch (error) {
      setStaffMessage(parseError(error));
    }
  }

  async function resetPassword(member: StaffMember) {
    const password = window.prompt(
      `Enter a new password for ${member.email}`,
      ""
    );
    if (!password) {
      return;
    }
    setStaffMessage(null);
    try {
      await patchJSON(`/api/staff/${member._id}`, { password });
      setStaffMessage(`Password updated for ${member.email}`);
    } catch (error) {
      setStaffMessage(parseError(error));
    }
  }

  async function deleteMember(member: StaffMember) {
    if (
      !window.confirm(
        `Delete ${member.email}? This action removes their access.`
      )
    ) {
      return;
    }
    setStaffMessage(null);
    try {
      await deleteJSON(`/api/staff/${member._id}`);
      await refreshStaff();
    } catch (error) {
      setStaffMessage(parseError(error));
    }
  }

  function handleRoleToggle(role: string) {
    setStaffForm(current => {
      const hasRole = current.roles.includes(role);
      const nextRoles = hasRole
        ? current.roles.filter(r => r !== role)
        : [...current.roles, role];
      return { ...current, roles: nextRoles };
    });
  }

  async function saveConfig(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!configDraft) {
      return;
    }
    setIsSavingConfig(true);
    setConfigMessage(null);
    try {
      const data = await patchJSON<SystemConfig>("/api/system/config", {
        maintenanceMode: configDraft.maintenanceMode,
        submissionsOpen: configDraft.submissionsOpen,
        announcement: configDraft.announcement,
        supportEmail: configDraft.supportEmail
      });
      setSystemConfig(data);
      setConfigDraft(data);
      setConfigMessage("Configuration saved.");
    } catch (error) {
      setConfigMessage(parseError(error));
    } finally {
      setIsSavingConfig(false);
    }
  }

  async function runSeed() {
    setIsSeeding(true);
    setSeedStatus(null);
    try {
      const result = await postJSON<{ inserted: number; skipped: number }>(
        "/api/admin/seed/all",
        {}
      );
      setSeedStatus(
        `Seed completed. Inserted ${result.inserted}, skipped ${result.skipped}.`
      );
    } catch (error) {
      setSeedStatus(parseError(error));
    } finally {
      setIsSeeding(false);
    }
  }

  return (
    <div className="page admin-dashboard stack-lg">
      <section className="card admin-section">
        <header className="admin-section__header">
          <div>
            <h2>Staff Directory</h2>
            <p className="text-muted">
              Manage analyst, moderator, and admin accounts. Password changes apply immediately.
            </p>
          </div>
          {staffMessage ? <p className="info-state">{staffMessage}</p> : null}
        </header>
        <div className="admin-panel-grid">
          <div className="admin-panel">
            <div className="table-responsive staff-table">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Roles</th>
                    <th>Active</th>
                    <th>Last Login</th>
                    <th aria-label="actions" />
                  </tr>
                </thead>
                <tbody>
                  {isLoadingStaff ? (
                    <tr>
                      <td colSpan={5}>Loading staff...</td>
                    </tr>
                  ) : staffSorted.length ? (
                    staffSorted.map(member => (
                      <tr key={member._id}>
                        <td>
                          <strong>{member.email}</strong>
                          {member.name ? (
                            <span className="text-muted block-label">
                              {member.name}
                            </span>
                          ) : null}
                        </td>
                        <td>{member.roles.join(", ") || "—"}</td>
                        <td>{member.active ? "Yes" : "No"}</td>
                        <td>
                          {member.lastLoginAt
                            ? new Date(member.lastLoginAt).toLocaleString()
                            : "Never"}
                        </td>
                        <td className="stack-sm admin-actions">
                          <button
                            type="button"
                            className="button-secondary"
                            onClick={() => toggleActive(member)}
                          >
                            {member.active ? "Deactivate" : "Activate"}
                          </button>
                          <button
                            type="button"
                            className="button-secondary"
                            onClick={() => resetPassword(member)}
                          >
                            Reset Password
                          </button>
                          <button
                            type="button"
                            className="button-danger"
                            onClick={() => deleteMember(member)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5}>No staff entries yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <form className="admin-panel form-grid" onSubmit={handleCreateStaff}>
            <h3>Add Staff Member</h3>
            <label>
              Email
              <input
                type="email"
                required
                value={staffForm.email}
                onChange={event =>
                  setStaffForm(current => ({
                    ...current,
                    email: event.target.value
                  }))
                }
              />
            </label>
            <label>
              Name
              <input
                value={staffForm.name}
                onChange={event =>
                  setStaffForm(current => ({
                    ...current,
                    name: event.target.value
                  }))
                }
              />
            </label>
            <label>
              Password
              <input
                type="password"
                required
                minLength={8}
                value={staffForm.password}
                onChange={event =>
                  setStaffForm(current => ({
                    ...current,
                    password: event.target.value
                  }))
                }
              />
            </label>
            <fieldset>
              <legend>Roles</legend>
              <div className="inline-checkboxes">
                {ROLE_OPTIONS.map(option => (
                  <label key={option}>
                    <input
                      type="checkbox"
                      checked={staffForm.roles.includes(option)}
                      onChange={() => handleRoleToggle(option)}
                    />
                    {option}
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={staffForm.active}
                onChange={event =>
                  setStaffForm(current => ({
                    ...current,
                    active: event.target.checked
                  }))
                }
              />
              Active
            </label>
            <button type="submit" disabled={isSavingStaff}>
              {isSavingStaff ? "Creating..." : "Create Staff"}
            </button>
          </form>
        </div>
      </section>

      <section className="card admin-section">
        <header className="admin-section__header">
          <div>
            <h2>System Configuration</h2>
            <p className="text-muted">
              Toggle maintenance mode, close submissions, or publish announcements to the team.
            </p>
          </div>
          {configMessage ? <p className="info-state">{configMessage}</p> : null}
        </header>
        {configDraft ? (
          <form className="form-grid admin-panel" onSubmit={saveConfig}>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={configDraft.maintenanceMode}
                onChange={event =>
                  setConfigDraft(current =>
                    current
                      ? { ...current, maintenanceMode: event.target.checked }
                      : current
                  )
                }
              />
              Maintenance mode
            </label>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={configDraft.submissionsOpen}
                onChange={event =>
                  setConfigDraft(current =>
                    current
                      ? { ...current, submissionsOpen: event.target.checked }
                      : current
                  )
                }
              />
              Accept submissions
            </label>
            <label>
              Support email
              <input
                value={configDraft.supportEmail}
                onChange={event =>
                  setConfigDraft(current =>
                    current
                      ? { ...current, supportEmail: event.target.value }
                      : current
                  )
                }
              />
            </label>
            <label>
              Announcement
              <textarea
                rows={3}
                value={configDraft.announcement}
                onChange={event =>
                  setConfigDraft(current =>
                    current
                      ? { ...current, announcement: event.target.value }
                      : current
                  )
                }
              />
            </label>
            <button type="submit" disabled={isSavingConfig}>
              {isSavingConfig ? "Saving..." : "Save configuration"}
            </button>
          </form>
        ) : (
          <div className="admin-panel">
            <p className="text-muted">Loading configuration…</p>
          </div>
        )}
      </section>

      <section className="card admin-section">
        <header className="admin-section__header">
          <div>
            <h2>Data Utilities</h2>
            <p className="text-muted">
              Re-seed demo practices, claims, submissions, and evidence for local testing.
            </p>
          </div>
          {seedStatus ? <p className="info-state">{seedStatus}</p> : null}
        </header>
        <div className="admin-panel">
          <button type="button" onClick={runSeed} disabled={isSeeding}>
            {isSeeding ? "Seeding..." : "Run demo seed"}
          </button>
        </div>
      </section>
    </div>
  );
}

function parseError(error: unknown) {
  if (!error) {
    return "Request failed.";
  }
  if (typeof error === "string") {
    return error;
  }
  if (typeof error === "object" && "message" in error) {
    return String((error as { message?: string }).message || "Request failed.");
  }
  return "Request failed.";
}
