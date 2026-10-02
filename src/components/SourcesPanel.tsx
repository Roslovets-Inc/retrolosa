import React, { Component, lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";

import type { EpochId } from "../epochs/catalog";
import { Button, Dialog } from "../ui";

const SourcesContent = lazy(() =>
  import("./SourcesDialog").then((module) => ({ default: module.SourcesContent })),
);

function SourcesFailure({ onReload }: { onReload: () => void }) {
  const { t } = useTranslation();
  return (
    <>
      <h2>{t("sourcesPanel.sourcesUnavailable")}</h2>
      <p role="alert">{t("sourcesPanel.theMapInformationCouldNotBeDisplayedYouCan")}</p>
      <p>{t("sourcesPanel.reloadTheAppToTryAgainYourCurrentView")}</p>
      <Button onClick={onReload}>{t("sourcesPanel.reloadTheApp")}</Button>
    </>
  );
}

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
    return <SourcesFailure onReload={this.props.onReload} />;
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
  const { t } = useTranslation();
  return (
    <Dialog
      open
      onOpenChange={onOpenChange}
      label={t("sourcesPanel.mapsAndAccuracy")}
      closeLabel={t("sourcesPanel.closeSources")}
    >
      <SourcesBoundary onReload={onReload}>
        <Suspense fallback={<p role="status">{t("sourcesPanel.loadingSources")}</p>}>
          <SourcesContent year={year} />
        </Suspense>
      </SourcesBoundary>
    </Dialog>
  );
}
