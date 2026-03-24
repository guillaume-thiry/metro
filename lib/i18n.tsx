"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Lang = "en" | "fr";

export const translations = {
  en: {
    home: {
      subtitle: "How well do you know the Paris Métro?",
      modes: {
        "complete-the-line": {
          title: "Complete the Line",
          description: "Given a sequence of stations in order, name the next one.",
        },
        "lines-to-name": {
          title: "Lines → Station",
          description: "Given a set of line numbers, name the station.",
        },
        "name-to-lines": {
          title: "Station → Lines",
          description: "Given a station name, select all lines it belongs to.",
        },
      },
      level: "Level",
      easy: "Easy — multiple choice",
      medium: "Medium — harder choices",
      hard: "Hard — type the answer",
    },
    game: {
      back: "← Back",
      score: "Score",
      placeholder: "Station name...",
      correct: "Correct!",
      wrongAnswer: "✗ The answer was:",
      wrongLines: "✗ Correct lines:",
      confirm: "Confirm",
      next: "Next →",
      seeResults: "See results",
    },
    prompt: {
      findNext: "Find the next station",
      linesToName: "Which station is on all these lines?",
      nameToLines: "Which lines does this station belong to?",
    },
    results: {
      title: "Results",
      playAgain: "Play again",
    },
  },
  fr: {
    home: {
      subtitle: "Connaissez-vous bien le métro parisien ?",
      modes: {
        "complete-the-line": {
          title: "Compléter la ligne",
          description: "Donnez la station suivante dans la séquence.",
        },
        "lines-to-name": {
          title: "Lignes → Station",
          description: "Trouvez la station commune à ces lignes.",
        },
        "name-to-lines": {
          title: "Station → Lignes",
          description: "Sélectionnez toutes les lignes de cette station.",
        },
      },
      level: "Niveau",
      easy: "Facile — QCM",
      medium: "Moyen — choix plus difficiles",
      hard: "Difficile — saisir la réponse",
    },
    game: {
      back: "← Retour",
      score: "Score",
      placeholder: "Nom de la station…",
      correct: "Correct !",
      wrongAnswer: "✗ La réponse était :",
      wrongLines: "✗ Lignes correctes :",
      confirm: "Valider",
      next: "Suivant →",
      seeResults: "Voir les résultats",
    },
    prompt: {
      findNext: "Trouvez la station suivante",
      linesToName: "Quelle station est sur toutes ces lignes ?",
      nameToLines: "Sur quelles lignes est cette station ?",
    },
    results: {
      title: "Résultats",
      playAgain: "Rejouer",
    },
  },
} as const;

type Translations = typeof translations.en;

const LangContext = createContext<{
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Translations;
}>({
  lang: "en",
  setLang: () => {},
  t: translations.en,
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const stored = localStorage.getItem("lang");
    if (stored === "fr" || stored === "en") setLangState(stored);
  }, []);

  function setLang(l: Lang) {
    setLangState(l);
    localStorage.setItem("lang", l);
  }

  return (
    <LangContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
