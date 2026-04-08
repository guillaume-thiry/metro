"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Lang = "en" | "fr";

export const translations = {
  en: {
    home: {
      subtitle: "Please, mind the gap between the train and the platform.",
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
          title: "Find the Lines",
          description: "Given a station name, select all lines it belongs to.",
        },
      },
      level: "Level",
      tournament: "Tournament",
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
      findMiddle: "Find the middle station",
      linesToName: "Which station is on all these lines?",
      nameToLines: "Which lines does this station belong to?",
    },
    difficulties: {
      easy: "Easy",
      medium: "Medium",
      hard: "Hard",
    },
    results: {
      title: "Results",
      playAgain: "Play again",
      home: "Menu",
      inARow: "in a row",
    },
  },
  fr: {
    home: {
      subtitle: "Attention à la marche en descendant du train.",
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
          title: "Trouver les lignes",
          description: "Sélectionnez toutes les lignes de cette station.",
        },
      },
      level: "Niveau",
      tournament: "Tournoi",
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
      findMiddle: "Trouvez la station du milieu",
      linesToName: "Quelle station est sur toutes ces lignes ?",
      nameToLines: "Sur quelles lignes est cette station ?",
    },
    difficulties: {
      easy: "Facile",
      medium: "Moyen",
      hard: "Difficile",
    },
    results: {
      title: "Résultats",
      playAgain: "Rejouer",
      home: "Accueil",
      inARow: "d'affilée",
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
    <LangContext.Provider value={{ lang, setLang, t: translations[lang] as Translations }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
