# Politik-Duell – Hinweise für GitHub Copilot

Es gelten dieselben Regeln wie für Claude Code: zuerst `CLAUDE.md` lesen (Grundprinzipien, Arbeitsweise, wo was steht).

- **Skills:** Die Abläufe liegen in `.claude/skills/<name>/SKILL.md` (Übersicht `.claude/skills/README.md`) und sind als Slash-Befehle aufrufbar, z. B. `/thema-anlegen`. Die Schritte genau so ausführen wie beschrieben, auch die `npm run …`-Befehle.
- **Agenten:** Wo ein Skill einen Agenten nennt (`ursachen-recherche`, `programm-erfassung`, `blind-bewertung`, `haltung-einordnung` …), den gleichnamigen Agenten aus `.claude/agents/` als Subagent starten – nicht selbst erledigen. Besonders Bewertung und Einordnung ohne Parteinamen dürfen nie im Hauptchat laufen.
- **Sperren:** `.github/hooks/sperre.json` ruft denselben Hook wie Claude Code auf (`.claude/hooks/sperre.mjs`): Parteiserver bleiben gesperrt, in Phase A die Programmtexte, und solange `blind-bewertung` oder `haltung-einordnung` läuft, nur deren Dateien. Eine Sperre nicht umgehen, sondern melden.
- **Windows:** Befehle laufen in PowerShell; `npm run …` funktioniert dort wie beschrieben. Bash-Konstrukte aus den Skills (`| tail`, `2>&1`) sinngemäß übertragen.
