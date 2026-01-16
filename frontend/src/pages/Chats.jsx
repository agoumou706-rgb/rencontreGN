import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api";
import { getToken } from "../auth";

function getMyIdFromJWT() {
  try {
    const token = getToken();
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload?.id ?? null;
  } catch {
    return null;
  }
}

export default function Chats() {
  const { matchId } = useParams();
  const myId = useMemo(() => getMyIdFromJWT(), []);
  const bottomRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState("");
  const [error, setError] = useState("");

  const scrollToBottom = () => bottomRef.current?.scrollIntoView({ behavior: "smooth" });

  const load = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await api.get(`/messages/${matchId}`);
      setMessages(res.data.messages || []);
      setTimeout(scrollToBottom, 50);
    } catch (err) {
      setError(err?.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  const send = async (e) => {
    e.preventDefault();
    const text = content.trim();
    if (!text) return;

    setError("");
    try {
      await api.post(`/messages/${matchId}`, { content: text });
      setContent("");
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || err.message);
    }
  };

  useEffect(() => {
    if (!loading) scrollToBottom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="rounded-3xl border border-violet-100 bg-gradient-to-r from-violet-50 to-white p-4">
        <div className="flex items-center gap-3">
          <Link
            to="/inbox"
            className="grid h-10 w-10 place-items-center rounded-2xl bg-white/80 text-slate-900 shadow-sm hover:bg-white"
            title="Retour"
          >
            ←
          </Link>

          <div className="flex-1">
            <div className="text-sm font-extrabold text-slate-900">Conversation</div>
            <div className="text-xs text-slate-600">match #{matchId}</div>
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

      {/* Messages */}
      <div className="rounded-3xl border border-violet-100 bg-white/80 shadow-sm backdrop-blur">
        <div className="h-[420px] overflow-auto p-4">
          {loading ? (
            <div className="text-sm text-slate-600">Chargement…</div>
          ) : messages.length === 0 ? (
            <div className="grid place-items-center py-14 text-center">
              <div className="mb-2 grid h-12 w-12 place-items-center rounded-2xl bg-violet-50 text-xl">
                💬
              </div>
              <div className="text-sm font-extrabold text-slate-900">Aucun message</div>
              <div className="mt-1 text-xs text-slate-600">Envoie le premier 💜</div>
            </div>
          ) : (
            <div className="space-y-2">
              {messages.map((m) => {
                const mine = myId && m.sender_id === myId;

                return (
                  <div key={m.id} className={mine ? "flex justify-end" : "flex justify-start"}>
                    <div
                      className={[
                        "max-w-[78%] rounded-3xl px-4 py-2 shadow-sm",
                        mine
                          ? "bg-violet-600 text-white rounded-br-lg"
                          : "bg-white text-slate-900 border border-slate-200 rounded-bl-lg",
                      ].join(" ")}
                    >
                      <div className="text-sm leading-snug">{m.content}</div>
                      <div className={mine ? "mt-1 text-[10px] text-white/80" : "mt-1 text-[10px] text-slate-500"}>
                        {new Date(m.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Composer */}
        <form onSubmit={send} className="flex gap-2 border-t border-violet-100 p-3">
          <input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Écris un message…"
            className="flex-1 rounded-2xl border border-slate-200 bg-white px-3 py-2 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
          />
          <button
            type="submit"
            className="rounded-2xl bg-violet-600 px-4 py-2 font-semibold text-white shadow-sm hover:bg-violet-700"
          >
            Envoyer
          </button>
        </form>
      </div>

      <div className="text-center text-[11px] text-slate-500">
        Deep Dating • reste respectueux ✨
      </div>
    </div>
  );
}