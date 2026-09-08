"use client";

import {
  Bookmark,
  Copy,
  Download,
  Edit,
  Share2,
  Trash2,
} from "lucide-react";
import { CircularCommandMenu } from "@/components/ui/circular-command-menu";

const commandItems = [
  { id: "copy", icon: <Copy className="h-5 w-5" />, label: "Copy", shortcut: "Cmd+C" },
  {
    id: "download",
    icon: <Download className="h-5 w-5" />,
    label: "Download",
    shortcut: "Cmd+D",
  },
  { id: "share", icon: <Share2 className="h-5 w-5" />, label: "Share", shortcut: "Cmd+S" },
  {
    id: "bookmark",
    icon: <Bookmark className="h-5 w-5" />,
    label: "Bookmark",
    shortcut: "Cmd+B",
  },
  { id: "edit", icon: <Edit className="h-5 w-5" />, label: "Edit", shortcut: "Cmd+E" },
  { id: "delete", icon: <Trash2 className="h-5 w-5" />, label: "Delete", shortcut: "Del" },
];

export default function CircularCommandMenuDemo() {
  return <CircularCommandMenu items={commandItems} />;
}
