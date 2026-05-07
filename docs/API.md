# Hoss Tracker 2026 — Setup & API Reference

## Fichiers

| Fichier | Description |
|---|---|
| Google Sheets | Hoss Tracker — Damien — Block 1-4 |
| Apps Script | API Web App (Code.gs) |

## URLs

- **Spreadsheet** : https://docs.google.com/spreadsheets/d/1yDzf5Ug_hkEe_x-Td1peTRrYGDAMXQUKzNPi-TccqWU/edit
- **API (Web App)** : https://script.google.com/macros/s/AKfycbx1fBaHJpvRSMKfTnpFM5OdML8IMeUKZEQnI-k3rVzl_V1Lq3lp4bIt6-xcHPny9p3OrA/exec
- **Google Drive Folder** : https://drive.google.com/drive/u/0/folders/1ECDSrDfJ6PbM9lWfKKTU7Zk5xWyU4psR

L'URL API est hardcodée comme fallback dans `index.html` (`CONFIG.SHEETS_API_URL_DEFAULT`). Override possible via `/reglages` (stocké en localStorage sous `hoss_sheets_api_url`).

---

## Structure des onglets (30 au total)

| Onglet | Contenu |
|---|---|
| Résumé de l'exportation | Sommaire Numbers→Excel (à ignorer) |
| Exercise List - Table 1 | Liste complète des exercices |
| BLOCK 1 EXERCISE SELECTION - Ta | Sélection exercices Block 1 (Zercher Squat, etc.) |
| WEEK 1 - Table 1 … WEEK 20 - Table 1 | 20 semaines d'entraînement |
| Block 1 Averages … Block 4 Averages | Moyennes par bloc |
| BLOCK 2/3/4 EXERCISE SELECTION | Sélections exercices Blocks 2-4 |

Convention de nommage : `WEEK 1 - Table 1` (majuscules pour la 1ère) puis `Week N - Table 1` pour N=2..20.

---

## Mapping cellules — WEEK N (validé par diagnostic Apps Script + smoke test)

### Sessions (lignes de header)

| Session | Header row | Set 1 row | Set 14 row |
|---|---|---|---|
| Monday | 8 | 13 | 26 |
| Wednesday | 36 | 41 | 54 |
| Friday | 63 | 68 | 81 |
| Saturday | 90 | 95 | 108 |

**Formule** : `setRow = headerRow + 4 + setNumber`

### Slots d'exercices (colonnes)

| Slot | Nom exercice | SET # | WEIGHT | REPS | RIR | Set Intensity |
|---|---|---|---|---|---|---|
| 1 | D | D | E | F | G | H |
| 2 | J | J | K | L | M | N |
| 3 | P | P | Q | R | S | T |
| 4 | V | V | W | X | Y | Z |

### Ligne prescription

`prescriptionRow = headerRow + 2`
(ex: Monday → row 10 contient la prescription de chaque exercice)

---

## API — Endpoints

### GET /exec — Health check

```bash
curl -L "https://script.google.com/macros/s/AKfycbx1fBaHJpvRSMKfTnpFM5OdML8IMeUKZEQnI-k3rVzl_V1Lq3lp4bIt6-xcHPny9p3OrA/exec"
```

Réponse :
```json
{"ok":true,"message":"Hoss Tracker API alive","timestamp":"2026-05-05T17:09:25.379Z"}
```

### POST /exec — writeSet

Écrit weight/reps/rir pour un set donné.

```bash
# Note : NE PAS utiliser -X POST avec -L. Apps Script renvoie un 302
# vers script.googleusercontent.com/macros/echo (GET-only).
# -X POST force la méthode après redirection → 405. Utiliser -d seul.
curl -sL -H "Content-Type: application/json" \
  -d '{"action":"writeSet","week":1,"sessionDay":"Monday","exerciseSlot":1,"setNumber":1,"weight":90,"reps":5,"rir":2}' \
  "https://script.google.com/macros/s/AKfycbx1fBaHJpvRSMKfTnpFM5OdML8IMeUKZEQnI-k3rVzl_V1Lq3lp4bIt6-xcHPny9p3OrA/exec"
```

Payload :

| Champ | Type | Valeurs |
|---|---|---|
| action | string | `"writeSet"` |
| week | number | 1–20 |
| sessionDay | string | `"Monday"`, `"Wednesday"`, `"Friday"`, `"Saturday"` |
| exerciseSlot | number | 1–4 |
| setNumber | number | 1–14 |
| weight | number | kg |
| reps | number | reps |
| rir | number | Reps In Reserve |

Réponse :
```json
{"ok":true,"written":{"week":1,"day":"Monday","slot":1,"set":1,"row":13}}
```

### POST /exec — readSession

Lit tous les exercices + sets d'une session.

```json
{"action":"readSession","week":1,"sessionDay":"Monday"}
```

### POST /exec — readWeek

Lit les 4 sessions d'une semaine complète.

```json
{"action":"readWeek","week":1}
```

---

## Smoke test exécuté le 2026-05-05

```bash
# 1. WriteSet bogus sur Week 20 Saturday slot 4 set 14
curl -sL -H "Content-Type: application/json" \
  -d '{"action":"writeSet","week":20,"sessionDay":"Saturday","exerciseSlot":4,"setNumber":14,"weight":999,"reps":99,"rir":5}' \
  ".../exec"
# → {"ok":true,"written":{"week":20,"day":"Saturday","slot":4,"set":14,"row":108}}

# 2. ReadSession round-trip
curl -sL -H "Content-Type: application/json" \
  -d '{"action":"readSession","week":20,"sessionDay":"Saturday"}' \
  ".../exec"
# → set 14 contient {weight:999, reps:99, rir:5} ✓
```

Mappings validés. **À retenir** : la cellule W108/X108/Y108 de Week 20 Saturday contient encore les valeurs de test (999/99/5) — à effacer manuellement avant le Block 4.

---

## Tests rapides (depuis n'importe quelle page Chrome)

```javascript
// Health check
fetch("https://script.google.com/macros/s/AKfycbx1fBaHJpvRSMKfTnpFM5OdML8IMeUKZEQnI-k3rVzl_V1Lq3lp4bIt6-xcHPny9p3OrA/exec")
  .then(r => r.json()).then(console.log);

// writeSet
fetch("https://script.google.com/macros/s/AKfycbx1fBaHJpvRSMKfTnpFM5OdML8IMeUKZEQnI-k3rVzl_V1Lq3lp4bIt6-xcHPny9p3OrA/exec", {
  method: "POST",
  body: JSON.stringify({action:"writeSet",week:1,sessionDay:"Monday",exerciseSlot:1,setNumber:1,weight:90,reps:5,rir:2})
}).then(r => r.json()).then(console.log);
```

---

## Redéployer après modification du code

1. Ouvrir le Spreadsheet → **Extensions → Apps Script**
2. Modifier `Code.gs`
3. **Ctrl+S** pour sauvegarder
4. **Déployer → Gérer les déploiements**
5. Cliquer ✏️ sur le déploiement actif → **Nouvelle version** → **Déployer**
6. L'URL reste la même (stable).
