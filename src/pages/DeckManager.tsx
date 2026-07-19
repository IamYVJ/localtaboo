import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../app/routes";
import { PageHeading } from "../components/PageHeading";
import { Panel } from "../components/Panel";
import { Button } from "../components/Button";
import { Badge } from "../components/Badge";
import { Dialog } from "../components/Dialog";
import { EmptyState } from "../components/EmptyState";
import { Switch } from "../components/form/Switch";
import { TextField } from "../components/form/TextField";
import { TextArea } from "../components/form/TextArea";
import { SegmentedControl } from "../components/form/SegmentedControl";
import { useDecks } from "../context/DeckContext";
import { useToast } from "../context/ToastContext";
import { STARTER_DECK_ID } from "../data/starterDeck";
import type { Deck } from "../game/types";
import type { DeckValidationResult } from "../game/validation";
import { deckToJsonString, downloadTextFile, parseDeckText } from "../utils/deckFiles";
import { copyToClipboard } from "../utils/clipboard";

type ImportMode = "json" | "text";

const TEXT_PLACEHOLDER = `#name: My party pack
VOLCANO = lava, eruption, mountain, magma, ash
GUITAR = strings, music, strum, band, chord`;

/** Turn a validation result into human-friendly toast + inline feedback. */
function summariseResult(result: DeckValidationResult): string {
  if (result.valid && result.deck) {
    const count = result.deck.cards.length;
    return `Imported “${result.deck.name}” with ${count} card${count === 1 ? "" : "s"}.`;
  }
  return result.errors[0] ?? "That deck could not be imported.";
}

export default function DeckManager() {
  const navigate = useNavigate();
  const {
    decks,
    activeDeckIds,
    activeCardCount,
    importDeck,
    removeDeck,
    toggleDeckActive,
    resetToStarter,
  } = useDecks();
  const { pushToast } = useToast();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importMode, setImportMode] = useState<ImportMode>("json");
  const [jsonText, setJsonText] = useState("");
  const [wordListText, setWordListText] = useState("");
  const [nameHint, setNameHint] = useState("");
  const [feedback, setFeedback] = useState<DeckValidationResult | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Deck | null>(null);
  const [resetOpen, setResetOpen] = useState(false);

  const importedCount = useMemo(() => decks.filter((d) => d.source === "imported").length, [decks]);

  const applyImport = (raw: unknown, fallbackName: string) => {
    const result = importDeck(raw, fallbackName || "Imported deck");
    setFeedback(result);
    pushToast(summariseResult(result), result.valid ? "success" : "error");
    if (result.valid) {
      setJsonText("");
      setWordListText("");
      setNameHint("");
    }
  };

  const importFromJson = (text: string, fallbackName: string) => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      const result: DeckValidationResult = {
        valid: false,
        errors: ["That text is not valid JSON. Check for a stray comma or quote."],
        warnings: [],
        deck: null,
      };
      setFeedback(result);
      pushToast(result.errors[0]!, "error");
      return;
    }
    applyImport(parsed, fallbackName);
  };

  const handleFile = (file: File) => {
    if (file.size > 1_000_000) {
      pushToast("That file is too large to be a deck.", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : "";
      importFromJson(text, file.name.replace(/\.json$/i, ""));
    };
    reader.onerror = () => pushToast("Could not read that file.", "error");
    reader.readAsText(file);
  };

  const handlePasteImport = () => {
    if (!jsonText.trim()) {
      pushToast("Paste some deck JSON first.", "warning");
      return;
    }
    importFromJson(jsonText, nameHint.trim());
  };

  const handleTextImport = () => {
    const parsed = parseDeckText(wordListText);
    if (parsed.cards.length === 0) {
      pushToast("No cards found. Use WORD = clue1, clue2 on each line.", "warning");
      return;
    }
    const name = parsed.name ?? nameHint.trim();
    applyImport({ ...(name ? { name } : {}), cards: parsed.cards }, name);
  };

  const exportDeck = (deck: Deck) => {
    downloadTextFile(
      `${deck.name.replace(/[^\w-]+/g, "_") || "deck"}.json`,
      deckToJsonString(deck),
    );
  };

  const copyDeck = async (deck: Deck) => {
    const ok = await copyToClipboard(deckToJsonString(deck));
    pushToast(
      ok ? "Deck JSON copied." : "Couldn’t copy — try exporting instead.",
      ok ? "success" : "warning",
    );
  };

  const confirmDelete = () => {
    if (pendingDelete) {
      removeDeck(pendingDelete.id);
      pushToast(`Removed “${pendingDelete.name}”.`, "info");
      setPendingDelete(null);
    }
  };

  const confirmReset = () => {
    resetToStarter();
    setResetOpen(false);
    setFeedback(null);
    pushToast("Decks reset to the built-in pack.", "info");
  };

  return (
    <div className="wl-stack wl-stack--xloose">
      <PageHeading
        eyebrow="Decks"
        title="Manage your decks"
        lede="Turn decks on or off, import your own, and export any deck to share. Custom decks are stored only on this device — nothing is uploaded."
      />

      <section aria-labelledby="your-decks" className="wl-stack">
        <div className="wl-cluster wl-cluster--between">
          <h2 id="your-decks" className="wl-h2">
            Your decks
          </h2>
          <span className="wl-small" aria-live="polite">
            {activeCardCount} cards in play
          </span>
        </div>

        <div className="wl-stack wl-stack--tight">
          {decks.map((deck) => {
            const active = activeDeckIds.includes(deck.id);
            const isStarter = deck.id === STARTER_DECK_ID;
            return (
              <Panel key={deck.id} className="wl-stack wl-stack--tight">
                <div className="wl-cluster wl-cluster--between">
                  <div className="wl-stack wl-stack--tight">
                    <div className="wl-cluster">
                      <span className="wl-body" style={{ fontWeight: "var(--weight-semibold)" }}>
                        {deck.name}
                      </span>
                      <Badge>{isStarter ? "Built-in" : "Custom"}</Badge>
                    </div>
                    <span className="wl-caption">
                      {deck.cards.length} card{deck.cards.length === 1 ? "" : "s"}
                      {deck.description ? ` · ${deck.description}` : ""}
                    </span>
                  </div>
                  <Switch
                    label={`Use ${deck.name}`}
                    checked={active}
                    onChange={() => toggleDeckActive(deck.id)}
                  />
                </div>
                <div className="wl-cluster">
                  <Button variant="secondary" size="sm" onClick={() => exportDeck(deck)}>
                    Export JSON
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => void copyDeck(deck)}>
                    Copy JSON
                  </Button>
                  {!isStarter ? (
                    <Button variant="ghost" size="sm" onClick={() => setPendingDelete(deck)}>
                      Delete
                    </Button>
                  ) : null}
                </div>
              </Panel>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="import-decks" className="wl-stack">
        <h2 id="import-decks" className="wl-h2">
          Import a deck
        </h2>

        <SegmentedControl<ImportMode>
          label="Import format"
          value={importMode}
          segments={[
            { value: "json", label: "JSON file / paste" },
            { value: "text", label: "Word list" },
          ]}
          onChange={setImportMode}
        />

        <Panel className="wl-stack">
          {importMode === "json" ? (
            <div className="wl-stack">
              <div className="wl-cluster">
                <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
                  Choose JSON file…
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json,.json"
                  className="wl-sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFile(file);
                    e.target.value = "";
                  }}
                />
              </div>
              <TextArea
                label="…or paste deck JSON"
                value={jsonText}
                rows={6}
                spellCheck={false}
                placeholder='{ "name": "My deck", "cards": [ { "word": "…", "forbidden": ["…"] } ] }'
                onChange={(e) => setJsonText(e.target.value)}
              />
              <div className="wl-cluster wl-cluster--between">
                <Button variant="accent" onClick={handlePasteImport}>
                  Import JSON
                </Button>
              </div>
            </div>
          ) : (
            <div className="wl-stack">
              <TextField
                label="Deck name"
                value={nameHint}
                maxLength={48}
                placeholder="My party pack"
                hint="Optional — a #name: line in the list wins if present."
                onChange={(e) => setNameHint(e.target.value)}
              />
              <TextArea
                label="One card per line"
                value={wordListText}
                rows={8}
                spellCheck={false}
                hint="Format: WORD = clue1, clue2, clue3 — you can also use | or : to separate the word."
                placeholder={TEXT_PLACEHOLDER}
                onChange={(e) => setWordListText(e.target.value)}
              />
              <Button variant="accent" onClick={handleTextImport}>
                Build deck
              </Button>
            </div>
          )}

          {feedback && (feedback.errors.length > 0 || feedback.warnings.length > 0) ? (
            <div className="wl-stack wl-stack--tight" role="status">
              {feedback.errors.map((err, i) => (
                <p key={`e-${i}`} className="wl-error">
                  {err}
                </p>
              ))}
              {feedback.warnings.map((warn, i) => (
                <p key={`w-${i}`} className="wl-small">
                  {warn}
                </p>
              ))}
            </div>
          ) : null}
        </Panel>
      </section>

      <section aria-labelledby="deck-reset" className="wl-stack">
        <h2 id="deck-reset" className="wl-h2">
          Start over
        </h2>
        {importedCount > 0 ? (
          <Panel className="wl-cluster wl-cluster--between">
            <span className="wl-small">
              Remove all {importedCount} custom deck{importedCount === 1 ? "" : "s"} and keep only
              the built-in pack.
            </span>
            <Button variant="danger" onClick={() => setResetOpen(true)}>
              Reset decks
            </Button>
          </Panel>
        ) : (
          <EmptyState
            title="Only the built-in pack is loaded"
            description="Import a deck above to add your own words."
          />
        )}
      </section>

      <div className="wl-cluster wl-cluster--between wl-safe-bottom">
        <Button variant="ghost" onClick={() => navigate(ROUTES.home)}>
          ← Back
        </Button>
      </div>

      <Dialog
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        title="Delete this deck?"
        description={
          pendingDelete
            ? `“${pendingDelete.name}” will be removed from this device. Export it first if you want to keep a copy.`
            : undefined
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              Delete deck
            </Button>
          </>
        }
      >
        <p className="wl-small">This can’t be undone.</p>
      </Dialog>

      <Dialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title="Reset all decks?"
        description="Every custom deck will be removed and only the built-in pack will remain active."
        footer={
          <>
            <Button variant="ghost" onClick={() => setResetOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmReset}>
              Reset decks
            </Button>
          </>
        }
      >
        <p className="wl-small">Export any decks you want to keep before resetting.</p>
      </Dialog>
    </div>
  );
}
