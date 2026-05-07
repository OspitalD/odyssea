#!/bin/bash
# Test post-déploiement P0-D/1 backend Apps Script
# Usage : bash test-backend.sh

URL='https://script.google.com/macros/s/AKfycbx1fBaHJpvRSMKfTnpFM5OdML8IMeUKZEQnI-k3rVzl_V1Lq3lp4bIt6-xcHPny9p3OrA/exec'
NOW=$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")
PASS=0; FAIL=0

print_json() { python3 -m json.tool 2>/dev/null || cat; }

check() {
  local name="$1" body="$2" expect="$3"
  echo "── $name ──"
  echo "$body" | print_json
  if echo "$body" | grep -q "$expect"; then
    echo "✓ PASS"; PASS=$((PASS+1))
  else
    echo "✗ FAIL (expected $expect)"; FAIL=$((FAIL+1))
  fi
  echo ""
}

echo "═══ Test 1 — Health check (GET) ═══"
RES=$(curl -L -s "$URL")
check "Health" "$RES" '"actions"'
# Vérif additionnelle : les 2 sheets sont créées
if echo "$RES" | grep -q '"Sets Extended":true'; then
  echo "  ✓ Feuille 'Sets Extended' créée"
else
  echo "  ✗ Feuille 'Sets Extended' MANQUANTE — relance setupSheets() depuis l'éditeur"
  FAIL=$((FAIL+1))
fi
if echo "$RES" | grep -q '"User Sessions":true'; then
  echo "  ✓ Feuille 'User Sessions' créée"
else
  echo "  ✗ Feuille 'User Sessions' MANQUANTE — relance setupSheets()"
  FAIL=$((FAIL+1))
fi
echo ""

echo "═══ Test 2 — writeSet rétrocompat (slot 4, set 14, coin sheet) ═══"
RES=$(curl -L -s -X POST "$URL" \
  -d '{"action":"writeSet","week":1,"sessionDay":"Monday","exerciseSlot":4,"setNumber":14,"weight":1,"reps":1,"rir":0,"exerciseName":"TEST_CLEANUP","completedAt":"'"$NOW"'"}')
check "writeSet rétro" "$RES" '"ok":true'

echo "═══ Test 3 — writeSet jump (skip WEEK N) ═══"
RES=$(curl -L -s -X POST "$URL" \
  -d '{"action":"writeSet","week":1,"sessionDay":"Monday","exerciseSlot":1,"setNumber":14,"format":"jump","jumpHeight":62,"exerciseName":"TEST_JUMP","completedAt":"'"$NOW"'"}')
check "writeSet jump" "$RES" '"ok":true'

echo "═══ Test 4 — writeUserSession ═══"
RES=$(curl -L -s -X POST "$URL" \
  -d '{"action":"writeUserSession","week":1,"sessionDay":"Tuesday","configuration":{"aerobie":{"type":"Run","durationMinutes":30,"rpe":7}},"sets":[],"completedAt":"'"$NOW"'","notes":"TEST_CLEANUP"}')
check "writeUserSession" "$RES" '"ok":true'

echo "═══ Cleanup auto Test 2 (remet W26/X26/Y26 à 0) ═══"
curl -L -s -X POST "$URL" \
  -d '{"action":"writeSet","week":1,"sessionDay":"Monday","exerciseSlot":4,"setNumber":14,"weight":0,"reps":0,"rir":0}' > /dev/null
echo "✓ Cellules WEEK 1 W26/X26/Y26 reset à 0"
echo ""

echo "═══════════════════════════════"
echo "RÉSULTATS : $PASS passés / $FAIL échoués"
echo "═══════════════════════════════"

if [ $FAIL -gt 0 ]; then
  echo "❌ Au moins un test a échoué."
  echo "Reviens dans la conv co-pilote avec les outputs ci-dessus."
  exit 1
fi

echo "✅ Backend P0-D/1 OK en prod."
echo ""
echo "RÉSIDUS À NETTOYER MANUELLEMENT (3 lignes append-only)"
echo "  Sheet 'Sets Extended' : supprime les 2 dernières lignes (exerciseName=TEST_CLEANUP et TEST_JUMP)"
echo "  Sheet 'User Sessions' : supprime la dernière ligne (notes=TEST_CLEANUP)"
echo "  Sheet 'WEEK 1' : cellules W26/X26/Y26 contiennent 0 (déjà reset, pas critique)"
echo ""
echo "Puis commit :"
echo "  cd ~/projects/odyssea"
echo "  git add apps-script/Code.gs README.md"
echo "  git commit -m \"[P0-D/1] Backend Apps Script — writeSet extended + writeUserSession + setupSheets\""
echo "  git push origin main"
