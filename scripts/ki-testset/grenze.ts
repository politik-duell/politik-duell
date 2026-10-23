// Obergrenze für KI-Aufrufe aus Skripten (ki:testset, ki:varianten). Das Spiel und die Skripte teilen sich ein
// Mistral-Konto mit Monatslimit: Ein großer Testlauf darf das Kontingent des Spiels nicht unbemerkt aufbrauchen
// (am 23.10.2026 erreicht – danach ordnete das Spiel nichts mehr ein). Ohne `--max-anfragen` gilt STANDARD.
export const STANDARD = 100

/** Bricht vor dem Lauf ab, wenn mehr Aufrufe geplant sind als erlaubt; sonst ein Zähler, der jeden Aufruf prüft. */
export function anfragenGrenze(geplant: number, argv: string[] = process.argv): () => void {
  const i = argv.indexOf('--max-anfragen')
  const erlaubt = i >= 0 ? Number(argv[i + 1]) : STANDARD
  if (!Number.isFinite(erlaubt) || erlaubt < 0) throw new Error('--max-anfragen braucht eine Zahl')
  if (geplant > erlaubt) {
    console.error(
      `Bis zu ${geplant} KI-Aufrufe geplant, erlaubt sind ${erlaubt}. Das Konto teilt sich das Monatslimit mit dem Spiel – ` +
        `Lauf verkleinern (--nur, --themen, --nur-thema, weniger --runden) oder bewusst --max-anfragen ${geplant} setzen.`,
    )
    process.exit(1)
  }
  let gezaehlt = 0
  return () => {
    if (++gezaehlt > erlaubt) throw new Error(`Obergrenze von ${erlaubt} KI-Aufrufen erreicht`)
  }
}
