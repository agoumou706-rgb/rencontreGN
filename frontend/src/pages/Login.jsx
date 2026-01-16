import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api";
import { setToken } from "../auth";

export default function Login() {
  const nav = useNavigate();
  const { search } = useLocation();

  const [mode, setMode] = useState("login"); // "login" | "register"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    gender: "Homme",
    looking_for: "Femme",
    city: "",
    bio: "",
  });

  const title = useMemo(
    () => (mode === "login" ? "Connexion" : "Créer un compte"),
    [mode]
  );

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100";

  const resetMessages = () => {
    setError("");
    setInfo("");
  };

  const onChange = (k) => (e) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  // ✅ reason=session => info message
  useEffect(() => {
    const reason = new URLSearchParams(search).get("reason");
    if (reason === "session") {
      setInfo("Session expirée. Reconnecte-toi 💜");
    }
  }, [search]);

  const switchMode = (next) => {
    setMode(next);
    resetMessages();
  };

  const forgotPassword = () => {
    resetMessages();
    setInfo("Fonction “mot de passe oublié” bientôt dispo 💜");
  };

  const submit = async (e) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);

    try {
      const email = (form.email || "").trim();
      const password = (form.password || "").trim();

      if (!email || !password) {
        setError("Email et mot de passe requis.");
        return;
      }

      if (mode === "register") {
        const name = (form.name || "").trim();
        if (!name) {
          setError("Ton nom est requis pour créer un compte.");
          return;
        }

        await api.post("/auth/register", {
          name,
          email,
          password,
          gender: form.gender,
          looking_for: form.looking_for,
          city: (form.city || "").trim(),
          bio: (form.bio || "").trim(),
        });
      }

      const res = await api.post("/auth/login", { email, password });
      setToken(res.data.token);
      nav("/browse");
    } catch (err) {
      setError(err?.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-[70vh] place-items-center">
      <div className="w-full max-w-sm">
        <div className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur">
          {/* Brand */}
          <div className="mb-4">
            <div className="text-2xl font-black tracking-tight text-slate-900">
              Deep Dating
            </div>
            <div className="text-sm text-slate-600">Plus qu’un match.</div>
          </div>

          {/* Tabs */}
          <div className="mb-4 grid grid-cols-2 rounded-2xl border border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              onClick={() => switchMode("login")}
              className={
                mode === "login"
                  ? "rounded-xl bg-white py-2 text-sm font-semibold text-slate-900 shadow-sm"
                  : "rounded-xl py-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
              }
            >
              Connexion
            </button>

            <button
              type="button"
              onClick={() => switchMode("register")}
              className={
                mode === "register"
                  ? "rounded-xl bg-white py-2 text-sm font-semibold text-slate-900 shadow-sm"
                  : "rounded-xl py-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
              }
            >
              Inscription
            </button>
          </div>

          <h3 className="mb-3 text-lg font-bold text-slate-900">{title}</h3>

          <form onSubmit={submit} className="grid gap-3">
            {mode === "register" && (
              <>
                <div className="grid gap-1">
                  <label className="text-xs font-semibold text-slate-600">
                    Nom
                  </label>
                  <input
                    className={inputClass}
                    placeholder="Ton nom"
                    value={form.name}
                    onChange={onChange("name")}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1">
                    <label className="text-xs font-semibold text-slate-600">
                      Je suis
                    </label>
                    <select
                      className={inputClass}
                      value={form.gender}
                      onChange={onChange("gender")}
                    >
                      <option>Homme</option>
                      <option>Femme</option>
                    </select>
                  </div>

                  <div className="grid gap-1">
                    <label className="text-xs font-semibold text-slate-600">
                      Je cherche
                    </label>
                    <select
                      className={inputClass}
                      value={form.looking_for}
                      onChange={onChange("looking_for")}
                    >
                      <option>Homme</option>
                      <option>Femme</option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-1">
                  <label className="text-xs font-semibold text-slate-600">
                    Ville
                  </label>
                  <input
                    className={inputClass}
                    placeholder="Ex: Conakry"
                    value={form.city}
                    onChange={onChange("city")}
                  />
                </div>

                <div className="grid gap-1">
                  <label className="text-xs font-semibold text-slate-600">
                    Bio
                  </label>
                  <textarea
                    className="min-h-[88px] w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                    placeholder="Dis un truc simple et vrai…"
                    value={form.bio}
                    onChange={onChange("bio")}
                  />
                </div>
              </>
            )}

            <div className="grid gap-1">
              <label className="text-xs font-semibold text-slate-600">Email</label>
              <input
                className={inputClass}
                placeholder="email@exemple.com"
                value={form.email}
                onChange={onChange("email")}
                autoComplete="email"
              />
            </div>

            <div className="grid gap-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-600">
                  Mot de passe
                </label>

                {mode === "login" && (
                  <button
                    type="button"
                    onClick={forgotPassword}
                    className="text-xs font-semibold text-violet-700 hover:text-violet-800"
                  >
                    Mot de passe oublié ?
                  </button>
                )}
              </div>

              <input
                className={inputClass}
                placeholder="••••••••"
                type="password"
                value={form.password}
                onChange={onChange("password")}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
            </div>

            {info && (
              <div className="rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-sm text-violet-800">
                {info}
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              disabled={loading}
              type="submit"
              className="mt-1 inline-flex items-center justify-center rounded-xl bg-violet-600 px-4 py-2.5 font-semibold text-white shadow-sm hover:bg-violet-700 disabled:opacity-60"
            >
              {loading ? "..." : mode === "login" ? "Se connecter" : "Créer le compte"}
            </button>

            <div className="text-center text-xs text-slate-500">
              En continuant, tu acceptes de respecter la communauté Deep Dating.
            </div>
          </form>
        </div>

        <div className="mt-3 text-center text-xs text-slate-500">
          Des rencontres sincères, sans pression 💜
        </div>
      </div>
    </div>
  );
}