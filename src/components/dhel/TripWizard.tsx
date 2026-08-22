"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Audience = "agent" | "traveler";

const STEPS_AGENT = [
  {
    key: "pax",
    question: "Who is travelling?",
    options: ["2 adults", "Family", "Group 5+", "Just me"],
  },
  {
    key: "nationality",
    question: "Nationality?",
    options: ["Indian", "Australian", "Chinese", "Mixed", "Other"],
  },
  {
    key: "days",
    question: "How long?",
    options: ["5 days", "6 days", "7 days", "10 days"],
  },
  {
    key: "entry",
    question: "How do they enter?",
    options: ["Fly Paro", "Hasimara land", "Bagdogra", "Not sure"],
  },
  {
    key: "budget",
    question: "Budget feel?",
    options: ["Economy", "Mid", "Comfort", "No limit"],
  },
] as const;

const STEPS_TRAVELER = [
  {
    key: "pax",
    question: "Who’s coming with you?",
    options: ["2 adults", "Family", "Group 5+", "Just me"],
  },
  {
    key: "nationality",
    question: "What’s your nationality?",
    options: ["Indian", "Australian", "Chinese", "Mixed", "Other"],
  },
  {
    key: "days",
    question: "How many days in Bhutan?",
    options: ["5 days", "6 days", "7 days", "10 days"],
  },
  {
    key: "entry",
    question: "How do you want to enter Bhutan?",
    options: ["Fly Paro", "Hasimara land", "Bagdogra", "Not sure"],
  },
  {
    key: "budget",
    question: "What budget feels right?",
    options: ["Economy", "Mid", "Comfort", "No limit"],
  },
] as const;

export function TripWizard({
  open,
  onClose,
  onComplete,
  audience = "agent",
}: {
  open: boolean;
  onClose: () => void;
  onComplete: (brief: string) => void;
  audience?: Audience;
}) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const STEPS = audience === "traveler" ? STEPS_TRAVELER : STEPS_AGENT;

  if (!open) return null;

  const current = STEPS[step]!;
  const isLast = step === STEPS.length - 1;

  function pick(option: string) {
    const next = { ...answers, [current.key]: option };
    setAnswers(next);
    if (isLast) {
      const pax = next.pax?.includes("Group")
        ? 6
        : next.pax?.includes("Just")
          ? 1
          : next.pax?.includes("Family")
            ? 4
            : 2;
      const days = parseInt(next.days || "7", 10);
      const brief =
        audience === "traveler"
          ? `I want a ${days}-day Bhutan trip for ${pax} travellers (${next.nationality ?? "International"} nationality), entering via ${next.entry ?? "Paro"}, budget: ${next.budget ?? "mid"}.`
          : `${pax} travellers, ${next.nationality ?? "International"} nationality, ${days}-day Bhutan trip, entering via ${next.entry ?? "Paro"}, budget: ${next.budget ?? "mid"}.`;
      onComplete(brief);
      setStep(0);
      setAnswers({});
    } else {
      setStep(step + 1);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{current.question}</CardTitle>
          <p className="text-sm text-[var(--muted-foreground)]">
            Step {step + 1} of {STEPS.length}
          </p>
        </CardHeader>
        <CardContent className="grid gap-2">
          {current.options.map((opt) => (
            <Button key={opt} variant="outline" className="justify-start" onClick={() => pick(opt)}>
              {opt}
            </Button>
          ))}
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
