import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  apiRequest,
  clearTokens,
  formRequest,
  jsonRequest,
  saveTokens,
} from "./api";
import "./styles.css";

const initialLogin = {
  emailOrUsername: "",
  password: "",
};

const initialRegister = {
  fullName: "",
  email: "",
  username: "",
  password: "",
  avatar: null,
  coverImage: null,
};

function App() {
  const [activeView, setActiveView] = useState("home");
  const [loginForm, setLoginForm] = useState(initialLogin);
  const [registerForm, setRegisterForm] = useState(initialRegister);
  const [accountForm, setAccountForm] = useState({ fullName: "", email: "" });
  const [channelName, setChannelName] = useState("");
  const [user, setUser] = useState(null);
  const [channel, setChannel] = useState(null);
  const [history, setHistory] = useState([]);
  const [health, setHealth] = useState("Checking");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const displayName = user?.fullName || user?.username || "Creator";

  const stats = useMemo(
    () => [
      { label: "User", value: user ? "Signed in" : "Guest" },
      { label: "History", value: history.length },
      { label: "API", value: health },
    ],
    [health, history.length, user],
  );

  useEffect(() => {
    checkHealth();
    loadCurrentUser(false);
  }, []);

  async function run(action, successMessage) {
    setBusy(true);
    setMessage("");

    try {
      const result = await action();
      if (successMessage) {
        setMessage(successMessage);
      }
      return result;
    } catch (error) {
      setMessage(error.message);
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function checkHealth() {
    try {
      await apiRequest("/healthcheck");
      setHealth("Online");
    } catch {
      setHealth("Offline");
    }
  }

  async function loadCurrentUser(showMessage = true) {
    return run(async () => {
      const response = await apiRequest("/users/current-user");
      setUser(response.data);
      setAccountForm({
        fullName: response.data?.fullName || "",
        email: response.data?.email || "",
      });
      return response;
    }, showMessage ? "Profile refreshed" : "");
  }

  async function handleLogin(event) {
    event.preventDefault();

    await run(async () => {
      const value = loginForm.emailOrUsername.trim();
      const isEmail = value.includes("@");
      const response = await jsonRequest("/users/login", "POST", {
        email: isEmail ? value : undefined,
        username: isEmail ? undefined : value,
        password: loginForm.password,
      });

      saveTokens(response.data);
      setUser(response.data.user);
      setAccountForm({
        fullName: response.data.user?.fullName || "",
        email: response.data.user?.email || "",
      });
      setActiveView("profile");
      return response;
    }, "Logged in successfully");
  }

  async function handleRegister(event) {
    event.preventDefault();

    await run(async () => {
      const formData = new FormData();
      formData.append("fullName", registerForm.fullName);
      formData.append("email", registerForm.email);
      formData.append("username", registerForm.username);
      formData.append("password", registerForm.password);
      formData.append("avatar", registerForm.avatar);

      if (registerForm.coverImage) {
        formData.append("coverImage", registerForm.coverImage);
      }

      const response = await formRequest("/users/register", "POST", formData);
      setActiveView("login");
      setRegisterForm(initialRegister);
      return response;
    }, "Account created. Sign in to continue.");
  }

  async function handleLogout() {
    await run(async () => {
      try {
        await apiRequest("/users/logout", { method: "POST" });
      } finally {
        clearTokens();
        setUser(null);
        setChannel(null);
        setHistory([]);
        setActiveView("home");
      }
    }, "Logged out");
  }

  async function handleAccountUpdate(event) {
    event.preventDefault();

    await run(async () => {
      const response = await jsonRequest("/users/update-account", "PATCH", accountForm);
      setUser(response.data);
      return response;
    }, "Account updated");
  }

  async function handleImageUpload(event, path, fieldName) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    await run(async () => {
      const formData = new FormData();
      formData.append(fieldName, file);
      const response = await formRequest(path, "PATCH", formData);
      setUser(response.data);
      return response;
    }, "Image updated");

    event.target.value = "";
  }

  async function handleChannelSearch(event) {
    event.preventDefault();

    await run(async () => {
      const response = await apiRequest(`/users/c/${channelName.trim()}`);
      setChannel(response.data);
      return response;
    }, "Channel loaded");
  }

  async function loadHistory() {
    await run(async () => {
      const response = await apiRequest("/users/history");
      setHistory(response.data || []);
      return response;
    }, "History loaded");
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">CS</span>
          <div>
            <strong>Creator Studio</strong>
            <small>Video API client</small>
          </div>
        </div>

        <nav className="nav">
          {["home", "login", "register", "profile", "channel"].map((view) => (
            <button
              className={activeView === view ? "active" : ""}
              key={view}
              onClick={() => setActiveView(view)}
              type="button"
            >
              {view}
            </button>
          ))}
        </nav>

        <div className="session-panel">
          <span className={`status-dot ${health.toLowerCase()}`} />
          <span>API {health}</span>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Dashboard</p>
            <h1>{displayName}</h1>
          </div>
          <div className="topbar-actions">
            <button type="button" onClick={() => loadCurrentUser()} disabled={busy}>
              Refresh
            </button>
            {user && (
              <button className="danger" type="button" onClick={handleLogout} disabled={busy}>
                Logout
              </button>
            )}
          </div>
        </header>

        {message && <div className="message">{message}</div>}

        <section className="stats-grid">
          {stats.map((item) => (
            <article className="metric" key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </article>
          ))}
        </section>

        {activeView === "home" && (
          <section className="content-grid">
            <article className="panel wide">
              <h2>API Surface</h2>
              <div className="endpoint-list">
                <span>Auth</span>
                <span>Profiles</span>
                <span>Uploads</span>
                <span>Channels</span>
                <span>History</span>
                <span>Videos</span>
              </div>
            </article>
            <article className="panel">
              <h2>Video Feed</h2>
              <div className="empty-state">Backend video controllers are pending.</div>
            </article>
          </section>
        )}

        {activeView === "login" && (
          <AuthPanel title="Login" onSubmit={handleLogin} busy={busy}>
            <label>
              Email or username
              <input
                value={loginForm.emailOrUsername}
                onChange={(event) =>
                  setLoginForm({ ...loginForm, emailOrUsername: event.target.value })
                }
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={loginForm.password}
                onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })}
                required
              />
            </label>
          </AuthPanel>
        )}

        {activeView === "register" && (
          <AuthPanel title="Register" onSubmit={handleRegister} busy={busy}>
            <label>
              Full name
              <input
                value={registerForm.fullName}
                onChange={(event) =>
                  setRegisterForm({ ...registerForm, fullName: event.target.value })
                }
                required
              />
            </label>
            <label>
              Email
              <input
                type="email"
                value={registerForm.email}
                onChange={(event) => setRegisterForm({ ...registerForm, email: event.target.value })}
                required
              />
            </label>
            <label>
              Username
              <input
                value={registerForm.username}
                onChange={(event) =>
                  setRegisterForm({ ...registerForm, username: event.target.value })
                }
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={registerForm.password}
                onChange={(event) =>
                  setRegisterForm({ ...registerForm, password: event.target.value })
                }
                required
              />
            </label>
            <label>
              Avatar
              <input
                type="file"
                accept="image/*"
                onChange={(event) =>
                  setRegisterForm({ ...registerForm, avatar: event.target.files?.[0] || null })
                }
                required
              />
            </label>
            <label>
              Cover image
              <input
                type="file"
                accept="image/*"
                onChange={(event) =>
                  setRegisterForm({ ...registerForm, coverImage: event.target.files?.[0] || null })
                }
              />
            </label>
          </AuthPanel>
        )}

        {activeView === "profile" && (
          <section className="content-grid">
            <article className="panel profile-panel">
              <div
                className="cover"
                style={{ backgroundImage: user?.coverImage ? `url(${user.coverImage})` : "" }}
              />
              <div className="profile-row">
                <img
                  alt=""
                  className="avatar"
                  src={user?.avatar || "https://placehold.co/120x120?text=Avatar"}
                />
                <div>
                  <h2>{displayName}</h2>
                  <p>@{user?.username || "not-signed-in"}</p>
                </div>
              </div>
              <div className="upload-row">
                <label className="file-button">
                  Avatar
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => handleImageUpload(event, "/users/avatar", "avatar")}
                    disabled={!user || busy}
                  />
                </label>
                <label className="file-button">
                  Cover
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) =>
                      handleImageUpload(event, "/users/cover-image", "coverImage")
                    }
                    disabled={!user || busy}
                  />
                </label>
              </div>
            </article>

            <article className="panel">
              <h2>Account</h2>
              <form className="form" onSubmit={handleAccountUpdate}>
                <label>
                  Full name
                  <input
                    value={accountForm.fullName}
                    onChange={(event) =>
                      setAccountForm({ ...accountForm, fullName: event.target.value })
                    }
                    disabled={!user}
                    required
                  />
                </label>
                <label>
                  Email
                  <input
                    type="email"
                    value={accountForm.email}
                    onChange={(event) =>
                      setAccountForm({ ...accountForm, email: event.target.value })
                    }
                    disabled={!user}
                    required
                  />
                </label>
                <button type="submit" disabled={!user || busy}>
                  Save
                </button>
              </form>
            </article>

            <article className="panel wide">
              <div className="panel-heading">
                <h2>Watch History</h2>
                <button type="button" onClick={loadHistory} disabled={!user || busy}>
                  Load
                </button>
              </div>
              <div className="video-grid">
                {history.length ? (
                  history.map((video) => (
                    <article className="video-card" key={video._id}>
                      <img alt="" src={video.thumbnail || "https://placehold.co/640x360?text=Video"} />
                      <strong>{video.title}</strong>
                      <span>{video.owner?.username}</span>
                    </article>
                  ))
                ) : (
                  <div className="empty-state">No history loaded.</div>
                )}
              </div>
            </article>
          </section>
        )}

        {activeView === "channel" && (
          <section className="content-grid">
            <article className="panel">
              <h2>Find Channel</h2>
              <form className="form" onSubmit={handleChannelSearch}>
                <label>
                  Username
                  <input
                    value={channelName}
                    onChange={(event) => setChannelName(event.target.value)}
                    required
                  />
                </label>
                <button type="submit" disabled={!user || busy}>
                  Search
                </button>
              </form>
            </article>

            <article className="panel profile-panel">
              <div
                className="cover"
                style={{
                  backgroundImage: channel?.coverImage ? `url(${channel.coverImage})` : "",
                }}
              />
              <div className="profile-row">
                <img
                  alt=""
                  className="avatar"
                  src={channel?.avatar || "https://placehold.co/120x120?text=Channel"}
                />
                <div>
                  <h2>{channel?.fullName || "Channel"}</h2>
                  <p>@{channel?.username || "username"}</p>
                </div>
              </div>
              <div className="mini-stats">
                <span>{channel?.subscribersCount || 0} subscribers</span>
                <span>{channel?.channelsSubscribedToCount || 0} subscribed</span>
              </div>
            </article>
          </section>
        )}
      </section>
    </main>
  );
}

function AuthPanel({ title, children, onSubmit, busy }) {
  return (
    <section className="auth-layout">
      <form className="panel form auth-form" onSubmit={onSubmit}>
        <h2>{title}</h2>
        {children}
        <button type="submit" disabled={busy}>
          {busy ? "Please wait" : title}
        </button>
      </form>
    </section>
  );
}

createRoot(document.getElementById("root")).render(<App />);
