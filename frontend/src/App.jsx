import React, { useEffect, useState } from "react";
import {
  Routes,
  Route,
  Navigate,
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import Login from "./pages/Login";
import Browse from "./pages/Browse";
import Inbox from "./pages/Inbox";
import Chats from "./pages/Chats";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";

import { clearToken, isLoggedIn } from "./auth";
import api from "./api";

function Protected({ children }) {
  return isLoggedIn() ? children : <Navigate to="/login" replace />;
}

function NavLink({ to, children, badge }) {
  return (
    <Link
      to={to}
      className="relative rounded-full border border-rose-200 bg-white/70 px-3 py-1.5 text-sm font-semibold text-slate-800 shadow-sm backdrop-blur hover:bg-white"
    >
      {children}

      {!!badge && badge > 0 && (
        <span className="absolute -right-1.5 -top-1.5 grid min-h-[18px] min-w-[18px] place-items-center rounded-full bg-rose-600 px-1 text-[11px] font-extrabold text-white shadow-sm">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </Link>
  );
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const [totalUnread, setTotalUnread] = useState(0);

  const showShell = isLoggedIn() && location.pathname !== "/login";

  const logout = () => {
    clearToken();
    navigate("/login");
  };

  // ✅ Poll unread count (simple + efficace)
  useEffect(() => {
    if (!showShell) return;

    let alive = true;

    const fetchUnread = async () => {
      try {
        const res = await api.get("/messages/inbox");
        const rows = res.data.inbox || [];
        const sum = rows.reduce(
          (acc, r) => acc + (Number(r.unread_count) || 0),
          0
        );
        if (alive) setTotalUnread(sum);
      } catch {
        // ne casse pas l'app si erreur réseau
      }
    };

    fetchUnread();
    const id = setInterval(fetchUnread, 8000);

    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [showShell]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-violet-50">
      <div className="mx-auto max-w-[440px] px-4 py-5">
        {/* HEADER */}
        <header className="mb-4 flex items-center gap-3">
          <div className="flex-1">
            <div className="text-xl font-black tracking-tight text-slate-900">
              Deep Dating
            </div>
            <div className="text-xs text-slate-600">Plus qu’un match.</div>
          </div>

          {isLoggedIn() && (
            <div className="flex flex-wrap items-center justify-end gap-2">
              <NavLink to="/browse">Découvrir</NavLink>

              <NavLink to="/inbox" badge={totalUnread}>
                Inbox
              </NavLink>

              <NavLink to="/profile">Profil</NavLink>
              <NavLink to="/settings">Paramètres</NavLink>

              <button
                onClick={logout}
                className="rounded-full border border-rose-200 bg-white/70 px-3 py-1.5 text-sm font-semibold text-slate-800 shadow-sm backdrop-blur hover:bg-white"
              >
                Déconnexion
              </button>
            </div>
          )}
        </header>

        {/* CONTENT */}
        {showShell ? (
          <main className="rounded-3xl border border-rose-200 bg-white/80 p-4 shadow-sm backdrop-blur">
            <Routes>
              <Route path="/login" element={<Login />} />

              <Route
                path="/browse"
                element={
                  <Protected>
                    <Browse />
                  </Protected>
                }
              />

              <Route
                path="/inbox"
                element={
                  <Protected>
                    <Inbox />
                  </Protected>
                }
              />

              <Route
                path="/chat/:matchId"
                element={
                  <Protected>
                    <Chats />
                  </Protected>
                }
              />

              <Route
                path="/profile"
                element={
                  <Protected>
                    <Profile />
                  </Protected>
                }
              />

              {/* ✅ SETTINGS */}
              <Route
                path="/settings"
                element={
                  <Protected>
                    <Settings />
                  </Protected>
                }
              />

              <Route
                path="*"
                element={
                  <Navigate
                    to={isLoggedIn() ? "/browse" : "/login"}
                    replace
                  />
                }
              />
            </Routes>
          </main>
        ) : (
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        )}

        {/* FOOTER */}
        <div className="mt-6 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} Deep Dating
        </div>
      </div>
    </div>
  );
}