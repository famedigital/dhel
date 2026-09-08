"use client";

import { AiChatLanding } from "@/components/ui/ai-chat-landing";

export default function PromptDesignPage() {
  return (
    <AiChatLanding
      variant="hero"
      greeting="What would you like to build?"
      placeholder="Ask anything…"
      onSubmit={(message) => console.log(message)}
    />
  );
}
