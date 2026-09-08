"use client";

import { useState } from "react";
import { MenuBar } from "@/components/ui/animated-menu-bar";

const menuItems = [
  "dashboard",
  "notifications",
  "settings",
  "help",
  "security",
] as const;

type MenuItem = (typeof menuItems)[number];

export default function AnimatedMenuBarDemo() {
  const [active, setActive] = useState<MenuItem>("dashboard");
  return <MenuBar active={active} onSelect={setActive} />;
}
