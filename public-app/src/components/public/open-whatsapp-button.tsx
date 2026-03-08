"use client";

import type { MouseEvent, ReactNode } from "react";

type OpenWhatsAppButtonProps = {
  appUrl: string;
  webUrl: string;
  className: string;
  children: ReactNode;
};

function isMobileDevice() {
  if (typeof navigator === "undefined") {
    return false;
  }

  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(
    navigator.userAgent,
  );
}

export function OpenWhatsAppButton({
  appUrl,
  webUrl,
  className,
  children,
}: OpenWhatsAppButtonProps) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (!isMobileDevice()) {
      return;
    }

    event.preventDefault();
    window.open(appUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <a className={className} href={webUrl} target="_blank" rel="noreferrer" onClick={handleClick}>
      {children}
    </a>
  );
}
