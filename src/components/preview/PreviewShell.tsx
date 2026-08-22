"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ClipboardList,
  Download,
  Map,
  Users,
} from "lucide-react";
import {
  MenuBar,
  type MenuBarItem,
} from "@/components/ui/animated-menu-bar";

type PreviewMenuKey = "edit" | "guest" | "ops" | "field" | "pdf";

export function PreviewShell({
  itineraryId,
  pack,
}: {
  itineraryId: string;
  pack: "guest" | "ops" | "field";
  /** @deprecated kept for call-site compat; print uses the iframe document */
  imageUrls?: string[];
}) {
  const router = useRouter();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [printHint, setPrintHint] = useState(false);

  const items = useMemo<MenuBarItem<PreviewMenuKey>[]>(
    () => [
      {
        key: "edit",
        label: "Edit",
        icon: <ArrowLeft strokeWidth={1.5} />,
      },
      {
        key: "guest",
        label: "Guest",
        icon: <Users strokeWidth={1.5} />,
        dividerBefore: true,
      },
      {
        key: "ops",
        label: "Ops",
        icon: <ClipboardList strokeWidth={1.5} />,
      },
      {
        key: "field",
        label: "Mobile",
        icon: <Map strokeWidth={1.5} />,
      },
      {
        key: "pdf",
        label: "PDF",
        icon: <Download strokeWidth={1.5} />,
        dividerBefore: true,
      },
    ],
    [],
  );

  function handlePrint() {
    setPrintHint(true);
    const frame = iframeRef.current?.contentWindow;
    if (frame) {
      frame.focus();
      frame.print();
      return;
    }
    window.print();
  }

  function onSelect(key: PreviewMenuKey) {
    if (key === "edit") {
      router.push(`/itineraries/${itineraryId}?tab=docs`);
      return;
    }
    if (key === "pdf") {
      handlePrint();
      return;
    }
    router.push(`/preview/${itineraryId}?pack=${key}`);
  }

  return (
    <div className="preview-shell">
      <div className="no-print preview-menubar">
        <MenuBar items={items} active={pack} onSelect={onSelect} />
        {printHint ? (
          <p className="preview-menubar-hint">
            Tip: enable Background graphics in the print dialog.
          </p>
        ) : null}
      </div>
      <div className="preview-iframe-wrap">
        <iframe
          ref={iframeRef}
          className="preview-iframe"
          title="Itinerary preview"
          src={`/itinerary-print/${itineraryId}?pack=${pack}`}
        />
      </div>
    </div>
  );
}
