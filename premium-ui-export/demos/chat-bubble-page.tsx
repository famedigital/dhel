"use client";

import {
  ChatBubbleVariants,
  ChatBubbleAiLayout,
  ChatBubbleStates,
} from "@/components/ui/chat-bubble-demo";

export default function ChatBubbleDesignPage() {
  return (
    <div className="mx-auto min-h-screen max-w-2xl space-y-10 bg-background p-6">
      <div>
        <h1 className="page-title mb-2">Chat bubbles</h1>
        <p className="page-lead mb-8">Sent / received / AI layout variants.</p>
        <ChatBubbleVariants />
      </div>
      <ChatBubbleAiLayout />
      <ChatBubbleStates />
    </div>
  );
}
