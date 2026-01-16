import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

function resolveAvatar(url) {
  if (!url) return null;
  if (url.startsWith("/uploads/")) return `http://localhost:4000${url}`;
  return url;
}

export default function Browse() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [stack, setStack] = useState([]);
  const [error, setError] = useState("");
  const [anim, setAnim] = useState(""); // "", "like", "pass"
  const [matchModal, setMatchModal] = useState(null); // { user_id, name, avatar_url, city, match_id }

  const current = stack[0] || null;
  const avatar = useMemo(() => resolveAvatar(current?.avatar_url), [current?.avatar_url]);

  const loadStack = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await api.get("/users/browse");
      setStack(res.data.users || []);
    } catch (err) {
      setError(err?.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStack();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const popAndMaybeReload = async () => {
    const next = stack.slice(1);
    setStack(next);
    if (next.length === 0) await loadStack();
  };

  const openMatchModal = async (user) => {
    try {
      const res = await api.get("/messages/inbox");
      const conv = (res.data.inbox || []).find((c) => c.user_id === user.id);
      setMatchModal({
        user_id: user.id,
        name: user.name,
        avatar_url: user.avatar_url,
        city: user.city,
        match_id: conv?.match_id ?? null,
      });
    } catch {
      setMatchModal({
        user_id: user.id,
        name: user.name,
        avatar_url: user.avatar_url,
        city: user.city,
        match_id: null,
      });
    }
  };

  const doAction = async (type) => {
    if (!current) return;
    setError("");

    setAnim(type);
    setTimeout(() => setAnim(""), 220);

    try {
      if (type === "like") {
        const res = await api.post(`/likes/${current.id}`);
        if (res.data?.match) await openMatchModal(current);
      } else {
        await api.post(`/passes/${current.id}`);
      }
      await popAndMaybeReload();
    } catch (err) {
      setError(err?.response?.data?.message || err.message);
    }
  };

  if (loading) return <div className="text-sm text-slate-600">Chargement…</div>;

  return (
    <div className="space-y-4">
      {/* MATCH MODAL */}
      {matchModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4">
          <div className="w-full max-w-[360px] rounded-3xl border border-violet-100 bg-white/90 p-5 text-center shadow-2xl backdrop-blur">
            <div className="text-xl font-black text-slate-900">🎉 C’est un match !</div>
            <div className="mt-1 text-sm text-slate-600">Plus qu’un match.</div>

            <div className="mx-auto mt-4 h-28 w-28 overflow-hidden rounded-full border border-slate-200 bg-violet-50">
              {resolveAvatar(matchModal.avatar_url) ? (
                <img
                  src={resolveAvatar(matchModal.avatar_url)}
                  alt="avatar"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="grid h-full w-full place-items-center text-2xl">🙂</div>
              )}
            </div>

            <div className="mt-3 text-lg font-extrabold text-slate-900">{matchModal.name}</div>
            <div className="text-xs text-slate-600">{matchModal.city || ""}</div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                className="rounded-2xl bg-violet-600 px-4 py-2.5 font-semibold text-white shadow-sm hover:bg-violet-700"
                onClick={() => {
                  const mid = matchModal.match_id;
                  setMatchModal(null);
                  if (mid) navigate(`/chat/${mid}`);
                  else navigate("/inbox");
                }}
              >
                💬 Discuter
              </button>

              <button
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 font-semibold text-slate-900 shadow-sm hover:bg-slate-50"
                onClick={() => setMatchModal(null)}
              >
                Continuer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOP BAR */}
      <div className="rounded-3xl border border-violet-100 bg-gradient-to-r from-violet-50 to-white p-4">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="text-sm font-extrabold text-slate-900">Découvrir</div>
            <div className="text-xs text-slate-600">Trouve une connexion qui a du sens.</div>
          </div>

          <button
            onClick={loadStack}
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

      {!current ? (
        <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 text-center shadow-sm">
          <div className="mx-auto mb-2 grid h-12 w-12 place-items-center rounded-2xl bg-violet-50 text-xl">
            ✨
          </div>
          <div className="text-sm font-extrabold text-slate-900">Aucun profil pour le moment</div>
          <div className="mt-1 text-xs text-slate-600">
            Essaie “Rafraîchir” ou change ta ville dans “Mon profil”.
          </div>
        </div>
      ) : (
        <>
          {/* CARD */}
          <div
            className={[
              "overflow-hidden rounded-3xl border border-slate-200 bg-white/80 shadow-sm backdrop-blur transition-transform duration-200",
              anim === "like" ? "translate-x-2 rotate-1" : "",
              anim === "pass" ? "-translate-x-2 -rotate-1" : "",
            ].join(" ")}
          >
            {/* image */}
            <div className="relative h-[340px] bg-slate-100">
              <div className="absolute left-3 top-3 rounded-full bg-white/80 px-3 py-1 text-xs font-bold text-slate-900 backdrop-blur">
                Deep Dating
              </div>

              {avatar ? (
                <img src={avatar} alt="avatar" className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full w-full place-items-center text-4xl">🙂</div>
              )}

              {/* gradient bottom */}
              <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-slate-950/50 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3">
                <div className="flex items-baseline justify-between gap-3">
                  <div className="text-xl font-black text-white drop-shadow">
                    {current.name}
                  </div>
                  <div className="text-xs font-semibold text-white/90 drop-shadow">
                    {current.city}
                  </div>
                </div>

                <div className="mt-1 text-xs font-semibold text-white/90 drop-shadow">
                  {current.gender} • cherche {current.looking_for}
                </div>
              </div>
            </div>

            {/* body */}
            <div className="p-4">
              <div className="text-sm leading-relaxed text-slate-800">
                {current.bio || <span className="text-slate-500">Bio vide</span>}
              </div>

              <div className="mt-3 text-xs text-slate-500">
                Profils restants : <span className="font-semibold text-slate-700">{stack.length}</span>
              </div>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="flex items-center justify-center gap-4 pt-1">
            <button
              onClick={() => doAction("pass")}
              title="Pass"
              className="grid h-14 w-14 place-items-center rounded-full border border-slate-200 bg-white text-xl shadow-sm hover:bg-slate-50 active:scale-95"
            >
              ❌
            </button>

            <button
              onClick={() => doAction("like")}
              title="Like"
              className="grid h-14 w-14 place-items-center rounded-full border border-violet-200 bg-violet-600 text-xl text-white shadow-sm hover:bg-violet-700 active:scale-95"
            >
              ❤️
            </button>
          </div>

          <div className="text-center text-[11px] text-slate-500">
            Astuce : si tu vois 0 profil, vérifie ta ville dans “Mon profil”.
          </div>
        </>
      )}
    </div>
  );
}