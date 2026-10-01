import React, { Component, lazy, Suspense } from "react";

import type { EpochId } from "../epochs/catalog";
import { Button, Dialog } from "../ui";

const SourcesContent = lazy(() =>
  import("./SourcesDialog").then((module) => ({ default: module.SourcesContent })),
);

class SourcesBoundary extends Component<
  { children: React.ReactNode; onReload: () => void },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <>
        <h2>Sources indisponibles</h2>
        <p role="alert">
          Les informations sur les cartes n’ont pas pu être affichées. Vous pouvez fermer cette
          fenêtre et continuer à explorer la carte.
        </p>
        <p>Rechargez l’application pour réessayer. Votre vue actuelle sera conservée.</p>
        <Button onClick={this.props.onReload}>Recharger l’application</Button>
      </>
    );
  }
}

export function SourcesPanel({
  year,
  onOpenChange,
  onReload,
}: {
  year: EpochId;
  onOpenChange: (open: boolean) => void;
  onReload: () => void;
}) {
  return (
    <Dialog
      open
      onOpenChange={onOpenChange}
      label="Cartes et précision"
      closeLabel="Fermer les sources"
    >
      <SourcesBoundary onReload={onReload}>
        <Suspense fallback={<p role="status">Chargement des sources…</p>}>
          <SourcesContent year={year} />
        </Suspense>
      </SourcesBoundary>
    </Dialog>
  );
}
