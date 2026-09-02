"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import thinkplusLogo from "../../public/thinkplus-logo-clean.png";

export function SiteHeader() {
  const [showResultsTitle, setShowResultsTitle] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isIimbUg = pathname.startsWith("/iimb-ug") || pathname.startsWith("/admin/iimb-ug");
  const isUgExperience = isHome || isIimbUg;

  useEffect(() => {
    const syncResultsTitle = (event?: Event) => {
      if (event instanceof CustomEvent && typeof event.detail === "boolean") {
        setShowResultsTitle(event.detail);
        return;
      }
      setShowResultsTitle(Boolean(document.querySelector("[data-iim-results-active='true']")));
    };
    syncResultsTitle();
    window.addEventListener("iim-results-visibility", syncResultsTitle);
    return () => window.removeEventListener("iim-results-visibility", syncResultsTitle);
  }, []);

  return (
    <header className={`site-header ${isUgExperience ? "ipmat-site-header" : ""}`}>
      <div className="shell site-header-inner">
        <Link className="site-wordmark" href="/" aria-label="IIMB UG Predictor home">
          <Image src={thinkplusLogo} alt="Thinkplus" priority />
        </Link>
        {isUgExperience ? <span aria-hidden="true" /> : showResultsTitle ? <strong className="header-results-title">Your IIM results</strong> : <span aria-hidden="true" />}
        <div className="header-tools">
          <div className="header-results-filter-host" id="header-results-filter-host" />
          <div className="header-actions">
            {isUgExperience ? null : showResultsTitle ? (
              <button type="button" className="header-cta" onClick={() => window.dispatchEvent(new Event("iim-edit-candidate"))}>Enter candidate details</button>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
