import { ArrowUpFromLine, Check, Download, EllipsisVertical, Smartphone, Wifi } from "lucide-react";
import React, { useState } from "react";
import { Trans, useTranslation } from "react-i18next";

import { useInstallation } from "../pwa";
import { Button, Dialog } from "../ui";

export function InstallApp() {
  const { t } = useTranslation();
  const { installed, canInstall, busy, message, install } = useInstallation();
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState<"iphone" | "android">(() =>
    /Android/i.test(navigator.userAgent) ? "android" : "iphone",
  );
  if (installed) return null;
  return (
    <>
      <Button
        className="header-icon install-trigger"
        aria-label={t("installApp.installRetrolosa")}
        data-tooltip={t("installApp.installTheApp")}
        onClick={() => setOpen(true)}
      >
        <Download size={18} aria-hidden="true" />
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        label={t("installApp.installRetrolosa")}
        closeLabel={t("installApp.closeInstallation")}
        className="install-modal"
      >
        <div className="install-hero">
          <img
            src={`${import.meta.env.BASE_URL}icons/icon-192.png`}
            width="76"
            height="76"
            alt=""
          />
          <span className="install-eyebrow">{t("installApp.toulouseThroughTime")}</span>
          <h2>
            {t("installApp.oneCityCenturiesOfHistory")} <br />
            {t("installApp.atYourFingertips")}{" "}
          </h2>
          <p>{t("installApp.addRetrolosaToYourHomeScreenAndExploreToulouse")}</p>
        </div>
        <div className="install-benefits">
          <span>
            <Smartphone size={16} aria-hidden="true" /> {t("installApp.fullScreen")}{" "}
          </span>
          <span>
            <Check size={16} aria-hidden="true" /> {t("installApp.freeNoAccountNeeded")}{" "}
          </span>
        </div>
        {canInstall ? (
          <Button className="install-action" onClick={install} disabled={busy}>
            <Download size={18} aria-hidden="true" />
            {busy ? t("installApp.installing") : t("installApp.installTheApp")}
          </Button>
        ) : (
          <>
            <div className="install-platforms" role="group" aria-label={t("installApp.yourPhone")}>
              <Button aria-pressed={phone === "iphone"} onClick={() => setPhone("iphone")}>
                iPhone / iPad
              </Button>
              <Button aria-pressed={phone === "android"} onClick={() => setPhone("android")}>
                Android
              </Button>
            </div>
            <ol className="install-steps">
              {phone === "iphone" ? (
                <>
                  <li>
                    <span>1</span>
                    <p>
                      <Trans i18nKey="installApp.iphoneOpen" components={{ strong: <strong /> }} />
                    </p>
                  </li>
                  <li>
                    <span>2</span>
                    <p>
                      <Trans
                        i18nKey="installApp.iphoneShare"
                        components={{
                          strong: <strong />,
                          icon: <ArrowUpFromLine size={16} aria-hidden="true" />,
                        }}
                      />
                    </p>
                  </li>
                  <li>
                    <span>3</span>
                    <p>
                      <Trans i18nKey="installApp.iphoneAdd" components={{ strong: <strong /> }} />
                    </p>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <span>1</span>
                    <p>
                      <Trans i18nKey="installApp.androidOpen" components={{ strong: <strong /> }} />
                    </p>
                  </li>
                  <li>
                    <span>2</span>
                    <p>
                      <Trans
                        i18nKey="installApp.androidMenu"
                        components={{
                          strong: <strong />,
                          icon: <EllipsisVertical size={16} aria-hidden="true" />,
                        }}
                      />
                    </p>
                  </li>
                  <li>
                    <span>3</span>
                    <p>
                      <Trans i18nKey="installApp.androidAdd" components={{ strong: <strong /> }} />
                    </p>
                  </li>
                </>
              )}
            </ol>
            <p className="install-desktop">
              {t("installApp.onAComputerUseTheInstallationOptionInThe")}
            </p>
          </>
        )}
        {message && (
          <p className="install-message" role="status">
            {t(message)}
          </p>
        )}
        <p className="install-network">
          <Wifi size={16} aria-hidden="true" />
          <span>{t("installApp.anInternetConnectionIsStillRequiredToLoadThe")}</span>
        </p>
      </Dialog>
    </>
  );
}
