#!/bin/bash
# Lance la suite Maestro (.maestro/*.yaml) dans l'ordre, contre l'app deja
# installee sur le simulateur/emulateur demarre (ou un appareil connecte).
# Genere un rapport JUnit par flow dans .maestro/results/, utilise ensuite
# pour produire TEST_REPORT.md.
set -uo pipefail

export PATH="$PATH:$HOME/.maestro/bin"

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FLOWS_DIR="$DIR/.maestro"
RESULTS_DIR="$FLOWS_DIR/results"
mkdir -p "$RESULTS_DIR"

FLOWS=()
while IFS= read -r -d '' f; do
  FLOWS+=("$f")
done < <(find "$FLOWS_DIR" -maxdepth 1 -name '[0-9]*.yaml' -print0 | sort -z)

if [ ${#FLOWS[@]} -eq 0 ]; then
  echo "Aucun flow trouve dans $FLOWS_DIR"
  exit 1
fi

overall_status=0

for flow in "${FLOWS[@]}"; do
  name=$(basename "$flow" .yaml)
  echo ""
  echo "=== Execution : $name ==="
  maestro test "$flow" --format junit --output "$RESULTS_DIR/$name.xml"
  status=$?
  if [ $status -ne 0 ]; then
    echo "!!! ECHEC : $name (code $status)"
    overall_status=1
  else
    echo "OK : $name"
  fi
done

echo ""
echo "Resultats JUnit dans : $RESULTS_DIR"
echo "Captures d'ecran dans : ~/.maestro/tests/<horodatage>/"
exit $overall_status
