# Odyssea — Ὀδύσσεια

PWA mobile-first pour la prépa **ATHX Marseille — 19 septembre 2026**.

20 semaines · 4 chants · 1 destination.

| Bloc | Nom | Semaines |
|---|---|---|
| 1 | Les Lotophages | 1-6 |
| 2 | Le Cyclope | 7-12 |
| 3 | Circé | 13-16 |
| 4 | Ithaque | 17-20 |

## Stack

- React 18 + Babel standalone via CDN, **pas de build step**
- Hash router custom, IndexedDB local (Dexie via CDN)
- Service worker pour offline
- Sync vers Apps Script Web App → Google Sheets (URL hardcodée, voir `docs/API.md`)
- Déploiement Netlify

## Dev local

```bash
python3 -m http.server 8080
# http://localhost:8080
```

## Déploiement

Push sur `main` → Netlify rebuild automatique (une fois le link Git configuré dans l'UI Netlify).

## Spec

Voir `SPEC_v3.md` + `SPEC_v4_patch.md` (hors repo).
