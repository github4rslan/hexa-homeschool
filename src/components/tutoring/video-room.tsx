"use client";

import Script from "next/script";
import { useEffect, useMemo, useRef, useState } from "react";
import { ExternalLink, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

declare global {
  interface Window {
    JitsiMeetExternalAPI?: new (
      domain: string,
      options: {
        roomName: string;
        parentNode: HTMLElement;
        width?: string;
        height?: string;
        userInfo?: { displayName?: string };
        configOverwrite?: Record<string, unknown>;
        interfaceConfigOverwrite?: Record<string, unknown>;
      },
    ) => {
      dispose: () => void;
    };
  }
}

export function VideoRoom({
  roomName,
  displayName,
}: {
  roomName: string;
  displayName: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<{ dispose: () => void } | null>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [loadKey, setLoadKey] = useState(0);
  const jitsiRoomName = useMemo(
    () => roomName.replace(/[^A-Za-z0-9]/g, "") || "EdwayTutoringRoom",
    [roomName],
  );
  const externalUrl = `https://meet.jit.si/${encodeURIComponent(jitsiRoomName)}`;

  useEffect(() => {
    if (!scriptReady || !containerRef.current || !window.JitsiMeetExternalAPI) return;

    apiRef.current?.dispose();
    containerRef.current.innerHTML = "";
    apiRef.current = new window.JitsiMeetExternalAPI("meet.jit.si", {
      roomName: jitsiRoomName,
      parentNode: containerRef.current,
      width: "100%",
      height: "100%",
      userInfo: { displayName },
      configOverwrite: {
        prejoinPageEnabled: true,
        disableDeepLinking: true,
      },
      interfaceConfigOverwrite: {
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
      },
    });

    return () => {
      apiRef.current?.dispose();
      apiRef.current = null;
    };
  }, [displayName, jitsiRoomName, loadKey, scriptReady]);

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-black">
      <Script
        src="https://meet.jit.si/external_api.js"
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
      />
      <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-abyss px-4 py-3">
        <p className="text-sm text-fog-300">
          Having trouble connecting? Open the same room directly in Jitsi.
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setLoadKey((v) => v + 1)}
          >
            <RotateCw className="h-4 w-4" />
            Reload
          </Button>
          <Button href={externalUrl} external variant="secondary" size="sm">
            <ExternalLink className="h-4 w-4" />
            Open Jitsi
          </Button>
        </div>
      </div>
      <div
        ref={containerRef}
        className="h-[70vh] min-h-[520px] w-full bg-black"
        aria-label="Tutoring video room"
      />
    </div>
  );
}
