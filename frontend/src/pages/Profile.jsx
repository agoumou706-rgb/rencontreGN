import React, { useEffect, useMemo, useState } from "react";
import api from "../api";

function resolveAvatar(url) {
  if (!url) return null;
  if (url.startsWith("/uploads/")) return `http://localhost:4000${url}`;
  return url;
}

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");

  const [me, setMe] = useState(null);

  const [form, setForm] = useState({
    name: "",
    gender: "",
    looking_for: "",
    city: "",
    bio: "",
  });

  const avatar = useMemo(() => resolveAvatar(me?.avatar_url), [me?.avatar_url]);

  const toastOk = (msg) => {
    setOkMsg(msg);
    setTimeout(() => setOkMsg(""), 1800);
  };

  const loadMe = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await api.get("/users/me");
      setMe(res.data.user);
      setForm({
        name: res.data.user?.name || "",
        gender: res.data.user?.gender || "",
        looking_for: res.data.user?.looking_for || "",
        city: res.data.user?.city || "",
        bio: res.data.user?.bio || "",
      });
    } catch (err) {
      setError(err?.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMe();
  }, []);

  const onChange = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    setError("");
    setOkMsg("");
    setSaving(true);
    try {
      await api.put("/users/me", form);
      toastOk("Profil mis à jour ✅");
      await loadMe();
    } catch (err) {
      setError(err?.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const uploadAvatar = async (file) => {
    if (!file) return;
    setError("");
    setOkMsg("");
    setUploading(true);

    try {
      // petit check client (optionnel mais pratique)
      const maxMb = 5;
      if (file.size > maxMb * 1024 * 1024) {
        throw new Error(`Image trop lourde (max ${maxMb}MB)`);
      }

      const fd = new FormData();
      fd.append("avatar", file);

      await api.post("/uploads/avatar", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toastOk("Photo mise à jour 📸");
      await loadMe();
    } catch (err) {
      setError(err?.response?.data?.message || err.message);
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div>Chargement…</div>;

  return (
    <div className="grid gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-lg font-black text-slate-900">Mon profil</div>
          <div className="text-xs text-slate-500">
            Mets une belle photo et une bio simple.
          </div>
        </div>

        <button
          onClick={loadMe}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
        >
          Rafraîchir
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {okMsg && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
          {okMsg}
        </div>
      )}

      {/* Card */}
      <div className="rounded-3xl border border-slate-200 bg-white/85 p-4 shadow-sm">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="h-16 w-16 overflow-hidden rounded-3xl bg-violet-50 ring-1 ring-slate-200">
            {avatar ? (
              <img
                src={avatar}
                alt="avatar"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="grid h-full w-full place-items-center text-2xl">
                🙂
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="truncate text-base font-black text-slate-900">
              {me?.name || "Utilisateur"}
            </div>
            <div className="truncate text-xs text-slate-500">{me?.email}</div>

            {/* Upload */}
            <div className="mt-2 flex items-center gap-2">
              <label className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-violet-600 px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-violet-700">
                {uploading ? "Upload…" : "Changer la photo"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => uploadAvatar(e.target.files?.[0])}
                />
              </label>

              <div className="text-[11px] text-slate-500">
                JPG/PNG • max 5MB
              </div>
            </div>
          </div>
        </div>

        <div className="my-4 h-px bg-slate-200" />

        {/* Form */}
        <form onSubmit={save} className="grid gap-3">
          <div className="grid gap-1">
            <label className="text-xs font-semibold text-slate-600">Nom</label>
            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
              value={form.name}
              onChange={onChange("name")}
              placeholder="Ton nom"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1">
              <label className="text-xs font-semibold text-slate-600">Je suis</label>
              <select
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                value={form.gender}
                onChange={onChange("gender")}
              >
                <option value="">—</option>
                <option>Homme</option>
                <option>Femme</option>
              </select>
            </div>

            <div className="grid gap-1">
              <label className="text-xs font-semibold text-slate-600">Je cherche</label>
              <select
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                value={form.looking_for}
                onChange={onChange("looking_for")}
              >
                <option value="">—</option>
                <option>Homme</option>
                <option>Femme</option>
              </select>
            </div>
          </div>

          <div className="grid gap-1">
            <label className="text-xs font-semibold text-slate-600">Ville</label>
            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
              value={form.city}
              onChange={onChange("city")}
              placeholder="Ex: Conakry"
            />
          </div>

          <div className="grid gap-1">
            <label className="text-xs font-semibold text-slate-600">Bio</label>
            <textarea
              className="min-h-[96px] w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
              value={form.bio}
              onChange={onChange("bio")}
              placeholder="Dis un truc simple et vrai…"
            />
            <div className="text-[11px] text-slate-500">
              {form.bio.length}/500
            </div>
          </div>

          <button
            disabled={saving}
            type="submit"
            className="mt-1 inline-flex items-center justify-center rounded-xl bg-violet-600 px-4 py-2.5 font-semibold text-white shadow-sm hover:bg-violet-700 disabled:opacity-60"
          >
            {saving ? "Sauvegarde…" : "Enregistrer"}
          </button>
        </form>
      </div>
    </div>
  );
}