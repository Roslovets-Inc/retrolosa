import { ArrowUpFromLine, Check, Download, EllipsisVertical, Smartphone, Wifi } from "lucide-react";
import React, { useState } from "react";

import { useInstallation } from "../pwa";
import { Button, Dialog } from "../ui";

export function InstallApp() {
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
        aria-label="Installer Rétrolosa"
        data-tooltip="Installer l’application"
        onClick={() => setOpen(true)}
      >
        <Download size={18} aria-hidden="true" />
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        label="Installer Rétrolosa"
        closeLabel="Fermer l’installation"
        className="install-modal"
      >
        <div className="install-hero">
          <img
            src={`${import.meta.env.BASE_URL}icons/icon-192.png`}
            width="76"
            height="76"
            alt=""
          />
          <span className="install-eyebrow">TOULOUSE, AU FIL DU TEMPS</span>
          <h2>
            Une ville. Des siècles.
            <br />À portée de main.
          </h2>
          <p>
            Retrouvez Rétrolosa sur votre écran d’accueil et explorez Toulouse dans une fenêtre
            dédiée.
          </p>
        </div>
        <div className="install-benefits">
          <span>
            <Smartphone size={16} aria-hidden="true" /> Plein écran
          </span>
          <span>
            <Check size={16} aria-hidden="true" /> Gratuit, sans compte
          </span>
        </div>
        {canInstall ? (
          <Button className="install-action" onClick={install} disabled={busy}>
            <Download size={18} aria-hidden="true" />
            {busy ? "Installation en cours…" : "Installer l’application"}
          </Button>
        ) : (
          <>
            <div className="install-platforms" role="group" aria-label="Votre téléphone">
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
                      Ouvrez ce site dans <strong>Safari</strong>.
                    </p>
                  </li>
                  <li>
                    <span>2</span>
                    <p>
                      Touchez <ArrowUpFromLine size={16} aria-hidden="true" />{" "}
                      <strong>Partager</strong> dans le menu du navigateur.
                    </p>
                  </li>
                  <li>
                    <span>3</span>
                    <p>
                      Choisissez <strong>Sur l’écran d’accueil</strong>, puis{" "}
                      <strong>Ajouter</strong>. Si l’option apparaît, gardez{" "}
                      <strong>Ouvrir comme app web</strong> activé.
                    </p>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <span>1</span>
                    <p>
                      Ouvrez ce site dans <strong>Chrome</strong>.
                    </p>
                  </li>
                  <li>
                    <span>2</span>
                    <p>
                      Touchez le menu <EllipsisVertical size={16} aria-hidden="true" /> du
                      navigateur.
                    </p>
                  </li>
                  <li>
                    <span>3</span>
                    <p>
                      Choisissez <strong>Installer l’application</strong> ou{" "}
                      <strong>Ajouter à l’écran d’accueil</strong>, puis confirmez.
                    </p>
                  </li>
                </>
              )}
            </ol>
            <p className="install-desktop">
              Sur ordinateur, utilisez l’option d’installation dans la barre d’adresse ou le menu du
              navigateur.
            </p>
          </>
        )}
        {message && (
          <p className="install-message" role="status">
            {message}
          </p>
        )}
        <p className="install-network">
          <Wifi size={16} aria-hidden="true" />
          <span>Une connexion Internet reste nécessaire pour charger les cartes.</span>
        </p>
      </Dialog>
    </>
  );
}
