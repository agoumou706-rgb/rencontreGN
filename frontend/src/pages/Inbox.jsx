import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import api from "../api";

function resolveAvatar(url) {
  if (!url) return null;
  if (url.startsWith("/uploads/")) return `http://localhost:4000${url}`;
  return url;
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 rounded-3xl border border-violet-100 bg-white/70 p-3 shadow-sm backdrop-blur">
      <div className="h-12 w-12 animate-pulse rounded-2xl bg-violet-100" />
      <div className="flex-1">
        <div className="h-3 w-32 animate-pulse rounded bg-slate-200" />
        <div className="mt-2 h-3 w-44 animate-pulse rounded bg-slate-200" />
      </div>
      <div className="h-8 w-16 animate-pulse rounded-full bg-violet-100" />
    </div>
  );
}

export default function Inbox() {
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [inbox, setInbox] = useState([]);
  const [error, setError] = useState("");

  const load = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await api.get("/messages/inbox");
      setInbox(res.data.inbox || []);
    } catch (err) {
      setError(err?.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Recharge quand tu reviens sur /inbox (ex: après avoir lu un chat)
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-3xl border border-violet-100 bg-gradient-to-r from-violet-50 to-white p-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-violet-600 text-white shadow-sm">
            💬
          </div>

          <div className="flex-1">
            <h3 className="text-lg font-black tracking-tight text-slate-900">
              Inbox
            </h3>
            <p className="text-xs text-slate-600">
              Tes conversations et tes matchs.
            </p>
          </div>

          <button
            onClick={load}
            className="rounded-full bg-violet-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-violet-700"
          >
            Rafraîchir
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid gap-3">
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      ) : inbox.length === 0 ? (
        <div className="rounded-3xl border border-violet-100 bg-white/70 p-6 text-center shadow-sm backdrop-blur">
          <div className="mx-auto mb-2 grid h-12 w-12 place-items-center rounded-2xl bg-violet-50 text-xl">
            💜
          </div>
          <div className="text-sm font-extrabold text-slate-900">
            Aucune conversation
          </div>
          <div className="mt-1 text-xs text-slate-600">
            Like des profils, et quand tu matches, tu verras tes chats ici.
          </div>

          <Link
            to="/browse"
            className="mt-4 inline-flex items-center justify-center rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-700"
          >
            Découvrir des profils
          </Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {inbox.map((c) => {
            const av = resolveAvatar(c.avatar_url);
            const last = c.last_message || "Aucun message pour l’instant";
            const unread = Number(c.unread_count || 0);

            return (
              <Link
                key={c.match_id}
                to={`/chat/${c.match_id}`}
                className="group flex items-center gap-3 rounded-3xl border border-violet-100 bg-white/80 p-3 shadow-sm backdrop-blur transition hover:-translate-y-[1px] hover:border-violet-200 hover:bg-white hover:shadow-md"
              >
                {/* Avatar */}
                <div className="relative h-12 w-12 overflow-hidden rounded-2xl border border-violet-100 bg-violet-50">
                  {av ? (
                    <img
                      src={av}
                      alt="avatar"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-lg">
                      🙂
                    </div>
                  )}

                  {/* ✅ point violet si non lu */}
                  {unread > 0 && (
                    <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-violet-600 ring-2 ring-white" />
                  )}
                </div>

                {/* Text */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <div className="truncate text-sm font-extrabold text-slate-900">
                      {c.name}
                    </div>
                    <div className="truncate text-xs text-slate-500">{c.city}</div>

                    {/* ✅ badge compteur */}
                    {unread > 0 && (
                      <span className="ml-auto rounded-full bg-violet-600 px-2 py-0.5 text-[11px] font-extrabold text-white shadow-sm">
                        Nouveau ({unread})
                      </span>
                    )}
                  </div>

                  <div className="truncate text-xs text-slate-600">{last}</div>
                </div>

                {/* CTA */}
                <div className="rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700 group-hover:bg-violet-100">
                  Ouvrir
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}