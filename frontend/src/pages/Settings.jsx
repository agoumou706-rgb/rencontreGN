import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { clearToken } from "../auth";

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-xl px-3 py-2 text-xs font-extrabold transition",
        active
          ? "bg-white text-slate-900 shadow-sm"
          : "text-slate-600 hover:text-slate-900",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export default function Settings() {
  const navigate = useNavigate();

  const [tab, setTab] = useState("privacy"); // privacy | terms | about | actions

  const logout = () => {
    clearToken();
    navigate("/login");
  };

  const title = useMemo(() => {
    if (tab === "privacy") return "Confidentialité";
    if (tab === "terms") return "Conditions";
    if (tab === "about") return "À propos";
    return "Actions";
  }, [tab]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-3xl border border-rose-200 bg-gradient-to-r from-rose-50 to-white p-4">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-rose-600 text-white shadow-sm">
            ⚙️
          </div>

          <div className="flex-1">
            <h3 className="text-lg font-black tracking-tight text-slate-900">
              Paramètres
            </h3>
            <p className="mt-1 text-xs text-slate-600">
              Confidentialité, règles, et infos sur Deep Dating.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl border border-rose-200 bg-rose-50/60 p-1">
          <TabButton active={tab === "privacy"} onClick={() => setTab("privacy")}>
            🔒 Confidentialité
          </TabButton>
          <TabButton active={tab === "terms"} onClick={() => setTab("terms")}>
            📜 Conditions
          </TabButton>
          <TabButton active={tab === "about"} onClick={() => setTab("about")}>
            💜 À propos
          </TabButton>
          <TabButton active={tab === "actions"} onClick={() => setTab("actions")}>
            ⚡ Actions
          </TabButton>
        </div>
      </div>

      {/* Content */}
      <section className="rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur">
        <div className="mb-3 flex items-center gap-2">
          <div className="text-sm font-extrabold text-slate-900">{title}</div>
          <div className="ml-auto rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-extrabold text-rose-700">
            Développeur : GOUMOU
          </div>
        </div>

        {/* PRIVACY */}
        {tab === "privacy" && (
          <div className="space-y-3 text-xs leading-relaxed text-slate-700">
            <p>
              Chez <strong>Deep Dating</strong>, ta vie privée est une priorité.
              Cette section explique ce que nous collectons, pourquoi, et quels sont tes droits.
            </p>

            <div className="rounded-2xl border border-rose-100 bg-rose-50/60 p-3">
              <div className="text-xs font-extrabold text-slate-900">Résumé rapide</div>
              <ul className="mt-2 list-disc pl-5">
                <li>On collecte uniquement ce qui est nécessaire au service.</li>
                <li>On ne vend jamais tes données.</li>
                <li>Tu peux modifier ton profil quand tu veux.</li>
                <li>Tu peux demander la suppression de ton compte (bientôt automatisé).</li>
              </ul>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-extrabold text-slate-900">1) Données collectées</div>
              <p>
                <strong>Données de compte :</strong> nom, email, mot de passe (stocké de façon sécurisée),
                ville, genre, préférence, bio, avatar (photo).
              </p>
              <p>
                <strong>Données d’usage :</strong> likes, passes, matchs, messages envoyés,
                et des infos techniques (ex: erreurs) pour améliorer la stabilité.
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-extrabold text-slate-900">2) Pourquoi on les utilise</div>
              <ul className="list-disc pl-5">
                <li>Créer ton profil et te connecter</li>
                <li>Te proposer des profils compatibles</li>
                <li>Gérer tes matchs et messages</li>
                <li>Protéger la plateforme (anti-abus, anti-spam)</li>
              </ul>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-extrabold text-slate-900">3) Messages</div>
              <p>
                Tes messages sont visibles uniquement par les participants à la conversation.
                Aucun message n’est publié publiquement.
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-extrabold text-slate-900">4) Partage des données</div>
              <p>
                <strong>Nous ne vendons pas tes données.</strong> Nous ne les partageons pas à des fins
                publicitaires externes.
              </p>
              <p>
                Nous pouvons traiter des données si la loi l’exige, ou pour protéger Deep Dating contre des abus.
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-extrabold text-slate-900">5) Tes droits</div>
              <ul className="list-disc pl-5">
                <li><strong>Accès</strong> : voir tes données</li>
                <li><strong>Rectification</strong> : modifier ton profil</li>
                <li><strong>Suppression</strong> : supprimer ton compte (bientôt)</li>
              </ul>
            </div>
          </div>
        )}

        {/* TERMS */}
        {tab === "terms" && (
          <div className="space-y-3 text-xs leading-relaxed text-slate-700">
            <p>
              Deep Dating est un espace basé sur le respect. En utilisant l’app, tu acceptes les règles ci-dessous.
            </p>

            <div className="space-y-2">
              <div className="text-xs font-extrabold text-slate-900">1) Comportements interdits</div>
              <ul className="list-disc pl-5">
                <li>Harcèlement, insultes, menaces</li>
                <li>Usurpation d’identité</li>
                <li>Contenus illégaux ou dangereux</li>
                <li>Spam, arnaques, sollicitations abusives</li>
              </ul>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-extrabold text-slate-900">2) Modération & sécurité</div>
              <p>
                En cas d’abus, Deep Dating peut limiter l’accès, bloquer des comptes, ou supprimer un profil
                afin de protéger la communauté.
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-extrabold text-slate-900">3) Responsabilité</div>
              <p>
                Les échanges se font entre utilisateurs. Deep Dating ne peut pas garantir le comportement de chacun,
                mais met en place des mécanismes (blocage, signalement futur, sécurité).
              </p>
            </div>

            <p className="text-[11px] text-slate-500">
              Ces conditions peuvent évoluer pour améliorer l’expérience et la sécurité.
            </p>
          </div>
        )}

        {/* ABOUT */}
        {tab === "about" && (
          <div className="space-y-3 text-xs leading-relaxed text-slate-700">
            <div className="rounded-2xl border border-rose-100 bg-rose-50/60 p-3">
              <div className="text-xs font-extrabold text-slate-900">
                Deep Dating — Plus qu’un match.
              </div>
              <p className="mt-2">
                Ici, on ne cherche pas juste des profils. On cherche des connexions vraies :
                respect, curiosité, intentions claires.
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-extrabold text-slate-900">Notre vibe</div>
              <ul className="list-disc pl-5">
                <li>Moins de bruit, plus de sens</li>
                <li>Des conversations simples, honnêtes, humaines</li>
                <li>Une expérience clean, rapide, agréable</li>
              </ul>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-extrabold text-slate-900">Mentions</div>
              <p>
                <strong>Nom :</strong> Deep Dating <br />
                <strong>Développeur :</strong> GOUMOU
              </p>
              <p className="text-[11px] text-slate-500">
                Plus tard on ajoute une page “Contact support”, et une suppression de compte 1-clic.
              </p>
            </div>
          </div>
        )}

        {/* ACTIONS */}
        {tab === "actions" && (
          <div className="space-y-3">
            <div className="rounded-2xl border border-rose-100 bg-rose-50/60 p-3 text-xs text-slate-700">
              <div className="font-extrabold text-slate-900">Actions rapides</div>
              <div className="mt-1 text-slate-600">
                Déconnexion et options de compte (suppression bientôt).
              </div>
            </div>

            <button
              onClick={logout}
              className="w-full rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-rose-700"
            >
              Se déconnecter
            </button>

            <button
              onClick={() => alert("Suppression de compte : bientôt disponible")}
              className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
            >
              Supprimer mon compte
            </button>

            <div className="text-center text-[11px] text-slate-500">
              Deep Dating • Développeur : GOUMOU
            </div>
          </div>
        )}
      </section>
    </div>
  );
}