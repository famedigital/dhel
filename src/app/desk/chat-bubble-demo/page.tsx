"use client";

import {
  ChatBubbleAiLayout,
  ChatBubbleStates,
  ChatBubbleVariants,
} from "@/components/ui/chat-bubble-demo";

export default function ChatBubbleDemoPage() {
  return (
    <div className="min-h-screen space-y-10 bg-background p-6">
      <div>
        <h1 className="mb-2 font-[family-name:var(--font-display)] text-2xl">
          Chat bubble
        </h1>
        <p className="mb-4 text-sm text-muted-foreground">Sent / received variants</p>
        <ChatBubbleVariants />
      </div>
      <div>
        <p className="mb-4 text-sm text-muted-foreground">AI layout + actions</p>
        <ChatBubbleAiLayout />
      </div>
      <div>
        <p className="mb-4 text-sm text-muted-foreground">Loading & error states</p>
        <ChatBubbleStates />
      </div>
    </div>
  );
}
