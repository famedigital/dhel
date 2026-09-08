"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { PromptInput } from "@/components/ui/ai-chat-input";
import { ExpandableText } from "@/components/ui/expandable-text";
import {
  ChatBubble,
  ChatBubbleAvatar,
  ChatBubbleMessage,
} from "@/components/ui/chat-bubble";
import type { BriefIntent, CityHotelChoices, PackageOption } from "@/lib/catalog";
import { findFormGaps } from "@/lib/catalog/gap-checker";
import { applyCostAnswerToIntent } from "@/lib/catalog/trip-costs";
import type { ItineraryContent } from "@/lib/types";
import type { ClarifyingQuestion } from "@/lib/desk/question-bank";
import { TripWizard } from "@/components/dhel/TripWizard";
import { HotelPickModal } from "@/components/dhel/HotelPickModal";
import { DraftItineraryPreview } from "@/components/dhel/DraftItineraryPreview";
import { BriefIntentForm } from "@/components/dhel/BriefIntentForm";
import { routeHotelsComplete, type HotelSelection } from "@/components/dhel/RouteHotelPicker";
import { stashItineraryClient } from "@/lib/offline/stash-client";
import { cn } from "@/lib/utils";

const COST_QUESTION_IDS = new Set([
  "room_avg",
  "guide_day",
  "car_day",
  "transfer_trip",
  "sdf",
  "cost_confirm",
]);

type MobileLayout = "tabs" | "stacked";
const MOBILE_LAYOUT_KEY = "proposal-mobile-layout";

type ChatMessage = { role: "user" | "assistant"; content: string };

function formatApiError(error: unknown): string {
  if (!error) return "Proposal failed";
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  if (typeof error === "object") {
    const obj = error as {
      formErrors?: string[];
      fieldErrors?: Record<string, string[] | undefined>;
      message?: string;
    };
    if (obj.message && typeof obj.message === "string") return obj.message;
    if (Array.isArray(obj.formErrors) && obj.formErrors[0]) return obj.formErrors[0];
    if (obj.fieldErrors) {
      const first = Object.values(obj.fieldErrors).flat().find(Boolean);
      if (first) return first;
    }
    try {
      return JSON.stringify(error);
    } catch {
      return "Proposal failed";
    }
  }
  return String(error);
}

type ProposalResponse = {
  status?: "ready" | "needs_clarification" | "needs_brief_confirm" | "needs_hotel";
  brief?: BriefIntent;
  options?: PackageOption[];
  compare?: Array<{
    id: string;
    hotel: string;
    city: string;
    room: string;
    nights: number;
    total_pp: number;
    currency: string;
    recommended: boolean;
    source: string;
  }>;
  hotelChoices?: CityHotelChoices[];
  selected?: PackageOption;
  content?: ItineraryContent;
  clientReply?: string;
  source?: "gemini" | "cursor" | "stub";
  aiProvider?: string;
  parseSource?: string;
  warning?: string;
  error?: string;
  assistantMessage?: string;
  questions?: ClarifyingQuestion[];
  gaps?: string[];
  usedDefaults?: boolean;
  generationMeta?: Record<string, unknown>;
  rawBrief?: string;
};

export function ProposalComposer({
  rateTier = "agent",
  onItineraryCreated,
}: {
  rateTier?: "agent" | "b2c";
  onItineraryCreated?: (id: string, mode?: "editor" | "preview") => void;
}) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [result, setResult] = useState<ProposalResponse | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hotelSelections, setHotelSelections] = useState<HotelSelection[]>([]);
  const [generating, setGenerating] = useState(false);
  const [freeText, setFreeText] = useState("");
  const [deskReady, setDeskReady] = useState(false);
  const [briefConfirm, setBriefConfirm] = useState(false);
  const [editIntent, setEditIntent] = useState<BriefIntent | null>(null);
  const [usedDefaults, setUsedDefaults] = useState(false);
  const [reviewContent, setReviewContent] = useState<ItineraryContent | null>(null);
  const [reviewMode, setReviewMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draftAnswers, setDraftAnswers] = useState<Record<string, string>>({});
  const [hotelModalOpen, setHotelModalOpen] = useState(false);
  const [mobileLayout, setMobileLayout] = useState<MobileLayout>("tabs");
  const [mobileTab, setMobileTab] = useState<"chat" | "itinerary">("chat");
  const [awaitingCosts, setAwaitingCosts] = useState(false);
  const threadEndRef = useRef<HTMLDivElement>(null);

  const formGaps = useMemo(() => {
    if (!editIntent) return [];
    return findFormGaps(editIntent).filter((g) => !COST_QUESTION_IDS.has(g));
  }, [editIntent]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(MOBILE_LAYOUT_KEY) as MobileLayout | null;
      if (stored === "tabs" || stored === "stacked") setMobileLayout(stored);
    } catch {
      /* ignore */
    }
  }, []);

  function setMobileLayoutPersist(next: MobileLayout) {
    setMobileLayout(next);
    try {
      localStorage.setItem(MOBILE_LAYOUT_KEY, next);
    } catch {
      /* ignore */
    }
  }

  const routeComplete = routeHotelsComplete(result?.hotelChoices ?? [], hotelSelections);
  const canGenerate = Boolean(
    (result?.hotelChoices?.length ? routeComplete : selectedId) && !generating,
  );

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading, deskReady, briefConfirm, reviewMode, result?.status, result?.questions]);

  async function callProposal(
    action: "parse" | "full",
    opts?: {
      optionId?: string;
      skipGapCheck?: boolean;
      extraMessages?: ChatMessage[];
      briefOverride?: string;
      confirmedIntent?: BriefIntent;
      hotelSelections?: HotelSelection[];
    },
  ) {
    const thread = opts?.extraMessages ?? messages;
    const briefFromThread = thread
      .filter((m) => m.role === "user" && m.content.trim())
      .map((m) => m.content.trim())
      .join("\n\n");
    const brief = (opts?.briefOverride ?? input).trim() || briefFromThread;
    const res = await fetch("/api/proposal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brief: brief || undefined,
        messages: thread,
        rateTier,
        action,
        optionId: opts?.optionId,
        skipGapCheck: opts?.skipGapCheck,
        confirmedIntent: opts?.confirmedIntent,
        hotelSelections: opts?.hotelSelections,
      }),
    });
    const data = (await res.json()) as ProposalResponse & { error?: unknown };
    if (!res.ok) throw new Error(formatApiError(data.error) || "Proposal failed");
    return data;
  }

  async function submitUserMessage(text: string, skipGapCheck = false) {
    const trimmed = text.trim();
    if (trimmed.length < 2) return;

    const userMsg: ChatMessage = { role: "user", content: trimmed };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setFreeText("");
    setDraftAnswers({});
    setLoading(true);
    setResult(null);
    setDeskReady(false);
    setBriefConfirm(false);
    setEditIntent(null);
    setSelectedId(null);
    setHotelSelections([]);

    try {
      const data = await callProposal("parse", { skipGapCheck, extraMessages: nextMessages });

      if (data.brief) setEditIntent(data.brief);

      if (data.status === "needs_clarification") {
        const assistantMsg: ChatMessage = {
          role: "assistant",
          content: data.assistantMessage || "I need a few more details before I can price this.",
        };
        setMessages([...nextMessages, assistantMsg]);
        setResult(data);
        setBriefConfirm(true);
        return;
      }

      if (data.status === "needs_brief_confirm" || data.brief) {
        const assistantMsg: ChatMessage = {
          role: "assistant",
          content:
            data.assistantMessage ||
            "I extracted trip details locally — confirm them, then choose hotels.",
        };
        setMessages([...nextMessages, assistantMsg]);
        setResult(data);
        setBriefConfirm(true);
        setUsedDefaults(Boolean(data.usedDefaults));
        return;
      }

      setDeskReady(true);
      setUsedDefaults(Boolean(data.usedDefaults));
      setResult(data);
      setSelectedId(null);
    } catch (e) {
      setResult({ error: e instanceof Error ? e.message : "Failed" });
    } finally {
      setLoading(false);
    }
  }

  async function confirmBriefAndLoadHotels() {
    if (!editIntent || formGaps.length) return;
    setLoading(true);
    try {
      const data = await callProposal("parse", {
        confirmedIntent: editIntent,
        skipGapCheck: usedDefaults,
      });
      setResult(data);
      setBriefConfirm(false);
      setDeskReady(true);
      setSelectedId(null);
      setHotelSelections([]);
      if (data.assistantMessage) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.assistantMessage! }]);
      }
    } catch (e) {
      setResult({ error: e instanceof Error ? e.message : "Failed" });
    } finally {
      setLoading(false);
    }
  }

  async function runFullGenerate() {
    if (!editIntent) return;
    setGenerating(true);
    try {
      const data = await callProposal("full", {
        optionId: selectedId ?? undefined,
        hotelSelections: result?.hotelChoices?.length ? hotelSelections : undefined,
        confirmedIntent: editIntent,
        skipGapCheck: usedDefaults,
      });
      if (data.status === "needs_clarification" || data.status === "needs_brief_confirm") {
        setResult(data);
        if (data.questions?.some((q) => COST_QUESTION_IDS.has(q.id))) {
          setAwaitingCosts(true);
          setDeskReady(true);
          setBriefConfirm(false);
          setReviewMode(false);
          if (data.brief) setEditIntent(data.brief);
          if (data.assistantMessage) {
            setMessages((prev) => [...prev, { role: "assistant", content: data.assistantMessage! }]);
          }
          return;
        }
        setBriefConfirm(true);
        setDeskReady(false);
        setReviewMode(false);
        if (data.brief) setEditIntent(data.brief);
        return;
      }
      if (data.status === "needs_hotel") {
        setResult(data);
        setDeskReady(true);
        setAwaitingCosts(false);
        return;
      }
      setResult(data);
      setAwaitingCosts(false);
      if (data.content) {
        setReviewContent(JSON.parse(JSON.stringify(data.content)) as ItineraryContent);
        setReviewMode(true);
        setDeskReady(false);
        setMobileTab("itinerary");
        if (data.clientReply) {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: `Draft ready — live guest PDF is on the right. ${data.clientReply}`,
            },
          ]);
        }
      }
    } catch (e) {
      setResult({ error: e instanceof Error ? e.message : "Failed" });
    } finally {
      setGenerating(false);
    }
  }

  async function saveReviewedDraft(mode: "editor" | "preview") {
    if (!result?.content && !reviewContent) return;
    setSaving(true);
    try {
      const content = reviewContent ?? result!.content!;
      const saveRes = await fetch("/api/itineraries/save-proposal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brief:
            result?.rawBrief ??
            messages
              .filter((m) => m.role === "user")
              .map((m) => m.content)
              .join("\n\n"),
          content,
          clientName: result?.brief?.client_name ?? content.prepared_for,
          days: result?.brief?.days ?? content.days?.length ?? 7,
          language: result?.brief?.language ?? "en",
          packageId: result?.selected?.id,
          packageOption: result?.selected,
          pax: result?.brief?.pax,
          adults: result?.brief?.adults ?? result?.brief?.pax,
          entryPoint: result?.brief?.entry_point,
          travelDates: content.travel_dates,
          messages,
          generationMeta: {
            ...(result?.generationMeta ?? {}),
            stay_plan: result?.brief?.stay_plan,
            trip_costs: result?.brief?.trip_costs as unknown as Record<string, unknown>,
          },
        }),
      });
      const saved = await saveRes.json();
      if (!saveRes.ok) throw new Error(saved.error || "Could not save itinerary");
      if (saved.id) {
        stashItineraryClient({
          id: saved.id,
          title:
            (result?.brief?.client_name
              ? `${result.brief.client_name} · ${result?.brief?.days ?? 7}D Bhutan`
              : undefined) ||
            content.trip_title ||
            "Bhutan trip",
          clientName: result?.brief?.client_name ?? content.prepared_for,
          days: result?.brief?.days ?? content.days?.length ?? 7,
          language: result?.brief?.language ?? "en",
          content: content as unknown as Record<string, unknown>,
          brief: result?.rawBrief,
        });
      }
      if (saved.id && onItineraryCreated) {
        onItineraryCreated(saved.id, mode);
      }
    } catch (e) {
      setResult({ ...result, error: e instanceof Error ? e.message : "Failed" });
    } finally {
      setSaving(false);
    }
  }

  function backToOptions() {
    setReviewMode(false);
    setReviewContent(null);
    setDeskReady(true);
  }

  function selectQuestionOption(questionId: string, option: string) {
    const questions = result?.questions ?? [];
    const next = { ...draftAnswers, [questionId]: option };
    setDraftAnswers(next);

    if (editIntent && COST_QUESTION_IDS.has(questionId)) {
      setEditIntent(applyCostAnswerToIntent(editIntent, questionId, option));
    }

    if (questions.length > 0 && questions.every((q) => next[q.id]?.trim())) {
      const combined = questions
        .map((q) => `${q.prompt.replace(/\?$/, "")}: ${next[q.id]}`)
        .join("\n");
      if (awaitingCosts && editIntent) {
        let intent = editIntent;
        for (const q of questions) {
          intent = applyCostAnswerToIntent(intent, q.id, next[q.id]!);
        }
        intent = {
          ...intent,
          trip_costs: { ...intent.trip_costs!, currency: intent.trip_costs?.currency ?? "INR", confirmed: true },
        };
        setEditIntent(intent);
        setMessages((prev) => [...prev, { role: "user", content: combined }]);
        setDraftAnswers({});
        setFreeText("");
        void (async () => {
          setGenerating(true);
          try {
            const data = await callProposal("full", {
              optionId: selectedId ?? undefined,
              hotelSelections: result?.hotelChoices?.length ? hotelSelections : undefined,
              confirmedIntent: intent,
              skipGapCheck: usedDefaults,
              extraMessages: [...messages, { role: "user", content: combined }],
            });
            setResult(data);
            if (data.content) {
              setReviewContent(JSON.parse(JSON.stringify(data.content)) as ItineraryContent);
              setReviewMode(true);
              setDeskReady(false);
              setAwaitingCosts(false);
              setMobileTab("itinerary");
            } else if (data.status === "needs_clarification") {
              setAwaitingCosts(true);
              if (data.brief) setEditIntent(data.brief);
            }
          } catch (e) {
            setResult({ error: e instanceof Error ? e.message : "Failed" });
          } finally {
            setGenerating(false);
          }
        })();
        return;
      }
      void submitUserMessage(combined);
    }
  }

  function submitDraftAnswers() {
    const questions = result?.questions ?? [];
    const parts = questions
      .filter((q) => draftAnswers[q.id]?.trim())
      .map((q) => `${q.prompt.replace(/\?$/, "")}: ${draftAnswers[q.id]}`);
    if (freeText.trim()) parts.push(freeText.trim());
    if (!parts.length) return;

    if (awaitingCosts && editIntent) {
      let intent = editIntent;
      for (const q of questions) {
        if (draftAnswers[q.id]) {
          intent = applyCostAnswerToIntent(intent, q.id, draftAnswers[q.id]!);
        }
      }
      if (freeText.trim()) {
        intent = applyCostAnswerToIntent(intent, "cost_confirm", freeText.trim());
      }
      intent = {
        ...intent,
        trip_costs: {
          currency: intent.trip_costs?.currency ?? "INR",
          ...intent.trip_costs,
          confirmed: true,
        },
      };
      setEditIntent(intent);
      const combined = parts.join("\n");
      setMessages((prev) => [...prev, { role: "user", content: combined }]);
      setDraftAnswers({});
      setFreeText("");
      void (async () => {
        setGenerating(true);
        try {
          const data = await callProposal("full", {
            optionId: selectedId ?? undefined,
            hotelSelections: result?.hotelChoices?.length ? hotelSelections : undefined,
            confirmedIntent: intent,
            skipGapCheck: usedDefaults,
          });
          setResult(data);
          if (data.content) {
            setReviewContent(JSON.parse(JSON.stringify(data.content)) as ItineraryContent);
            setReviewMode(true);
            setDeskReady(false);
            setAwaitingCosts(false);
            setMobileTab("itinerary");
          }
        } catch (e) {
          setResult({ error: e instanceof Error ? e.message : "Failed" });
        } finally {
          setGenerating(false);
        }
      })();
      return;
    }

    void submitUserMessage(parts.join("\n"));
  }

  const awaitingQuestions =
    (result?.status === "needs_clarification" && result.questions?.length && !editIntent) ||
    (awaitingCosts && Boolean(result?.questions?.length));
  const hasThread = messages.length > 0 || loading;
  const answeredCount = result?.questions?.filter((q) => draftAnswers[q.id]?.trim()).length ?? 0;
  const allQuestionsAnswered =
    Boolean(result?.questions?.length) && answeredCount === (result?.questions?.length ?? 0);

  const showHotelStep =
    deskReady &&
    !reviewMode &&
    !awaitingCosts &&
    (Boolean(result?.hotelChoices?.length) || Boolean(result?.options?.length));

  useEffect(() => {
    if (showHotelStep) setHotelModalOpen(true);
    else setHotelModalOpen(false);
  }, [showHotelStep]);

  const isB2c = rateTier === "b2c";
  const showLivePreview = Boolean(reviewMode && reviewContent);
  const showSplitDesktop = showLivePreview;

  const chatColumn = (
    <div className="desk-chat flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div
          className={cn(
            "mx-auto flex min-h-full w-full flex-col px-4 sm:px-6",
            showSplitDesktop ? "max-w-none" : "max-w-[760px]",
          )}
        >
          {!hasThread ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-2 pb-8 pt-10 text-center">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                {isB2c ? "Plan your Bhutan trip" : "Proposal desk"}
              </p>
              <h1 className="desk-chat-greeting">
                {isB2c ? "How do you want your Bhutan itinerary?" : "What does the client want?"}
              </h1>
              <p className="max-w-md text-sm text-[var(--muted-foreground)]">
                {isB2c
                  ? "Tell us your dates, group size, and what you love — we shape a private journey and hotels around you."
                  : "Paste WhatsApp or email — clarify gaps, pick hotels per city, confirm cost lines, then see the live guest PDF."}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-1 py-4 sm:py-6">
              <p className="mb-4 text-center text-xs text-[var(--muted-foreground)]">
                {isB2c
                  ? "Your brief · hotels · draft itinerary"
                  : "Brief · hotels · cost lines · live PDF"}
              </p>
              {messages.map((m, i) => {
                const variant = m.role === "user" ? "sent" : "received";
                return (
                  <ChatBubble key={i} variant={variant}>
                    <ChatBubbleAvatar fallback={m.role === "user" ? "You" : "AI"} />
                    <ChatBubbleMessage variant={variant}>
                      <ExpandableText>{m.content}</ExpandableText>
                    </ChatBubbleMessage>
                  </ChatBubble>
                );
              })}
              {loading || generating ? (
                <ChatBubble variant="received">
                  <ChatBubbleAvatar fallback="AI" />
                  <ChatBubbleMessage isLoading />
                </ChatBubble>
              ) : null}

              {awaitingQuestions ? (
                <div className="ml-10 mt-2 space-y-4 rounded-2xl bg-muted/50 px-4 py-3">
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {awaitingCosts
                      ? "Confirm cost lines for this trip (room, guide, car, pickup+drop, SDF)."
                      : "Pick an answer for each question — or edit the form below."}
                  </p>
                  {result!.questions!.map((q) => (
                    <div key={q.id} className="space-y-2">
                      <p className="text-sm font-medium">{q.prompt}</p>
                      <div className="flex flex-wrap gap-2">
                        {q.options.map((opt: string) => {
                          const selected = draftAnswers[q.id] === opt;
                          return (
                            <Button
                              key={opt}
                              variant={selected ? "default" : "outline"}
                              size="sm"
                              disabled={loading || generating}
                              onClick={() => selectQuestionOption(q.id, opt)}
                            >
                              {opt}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  <div className="flex gap-2 pt-1">
                    <Input
                      placeholder="Or type your own answer…"
                      value={freeText}
                      onChange={(e) => setFreeText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && (freeText.trim() || answeredCount > 0)) {
                          submitDraftAnswers();
                        }
                      }}
                    />
                    <Button
                      disabled={loading || generating || (!freeText.trim() && answeredCount === 0)}
                      onClick={submitDraftAnswers}
                    >
                      {allQuestionsAnswered || freeText.trim() ? "Send" : "Send answers"}
                    </Button>
                  </div>
                </div>
              ) : null}

              <AnimatePresence mode="wait">
                {loading && !briefConfirm ? (
                  <motion.div
                    key="skel"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="mt-6 grid gap-4 md:grid-cols-3"
                  >
                    {[0, 1, 2].map((i) => (
                      <Skeleton key={i} className="h-48 rounded-xl" />
                    ))}
                  </motion.div>
                ) : briefConfirm && editIntent ? (
                  <motion.div
                    key="brief"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6"
                  >
                    <BriefIntentForm
                      intent={editIntent}
                      gaps={formGaps}
                      onChange={setEditIntent}
                      confirming={loading}
                      onConfirm={() => void confirmBriefAndLoadHotels()}
                    />
                  </motion.div>
                ) : showHotelStep ? (
                  <motion.div
                    key="hotels"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6"
                  >
                    <Card className="border-border">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Hotels ready to choose</CardTitle>
                        <CardDescription>
                          Pick a hotel for each city — then confirm cost lines and generate the live
                          PDF.
                        </CardDescription>
                      </CardHeader>
                      <CardFooter className="flex flex-wrap gap-2 pt-2">
                        <Button type="button" onClick={() => setHotelModalOpen(true)}>
                          Open hotel picker
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setBriefConfirm(true);
                            setDeskReady(false);
                          }}
                        >
                          Edit trip details
                        </Button>
                      </CardFooter>
                    </Card>
                  </motion.div>
                ) : showLivePreview ? (
                  <motion.div
                    key="live-hint"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4"
                  >
                    <Card className="border-border">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Draft ready</CardTitle>
                        <CardDescription>
                          Live guest itinerary is open beside this chat. Ask for tweaks, or save to
                          print.
                        </CardDescription>
                      </CardHeader>
                      <CardFooter className="flex flex-wrap gap-2 pt-2 lg:hidden">
                        <Button type="button" size="sm" onClick={() => setMobileTab("itinerary")}>
                          View itinerary
                        </Button>
                      </CardFooter>
                    </Card>
                  </motion.div>
                ) : null}
              </AnimatePresence>

              {result?.error ? (
                <Alert variant="destructive" className="mt-4">
                  {typeof result.error === "string" ? result.error : formatApiError(result.error)}
                </Alert>
              ) : null}

              <div ref={threadEndRef} />
            </div>
          )}
        </div>
      </div>

      {!briefConfirm ? (
        <div className="desk-chat-dock relative shrink-0">
          <div
            className={cn(
              "mx-auto w-full space-y-3",
              showSplitDesktop ? "max-w-none px-3" : "max-w-[760px]",
            )}
          >
            {!awaitingQuestions ? (
              <>
                <PromptInput
                  fullWidth
                  minimal
                  className="desk-chat-box mx-auto"
                  value={input}
                  onChange={setInput}
                  placeholder={
                    showLivePreview
                      ? "Ask to tweak the draft (e.g. warmer letter, Day 3 focus)…"
                      : isB2c
                        ? "Describe your ideal Bhutan trip…"
                        : "Paste client WhatsApp or email…"
                  }
                  onSubmit={(message) => {
                    if (loading || generating) return;
                    void submitUserMessage(message);
                  }}
                />
                <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 pb-1 text-xs text-[var(--muted-foreground)]">
                  {!showLivePreview ? (
                    <button
                      type="button"
                      className="underline-offset-2 hover:text-foreground hover:underline"
                      onClick={() => setWizardOpen(true)}
                    >
                      {isB2c ? "Prefer guided questions?" : "No message? Use wizard"}
                    </button>
                  ) : null}
                  <span>Enter to send · Shift+Enter for a new line</span>
                </div>
              </>
            ) : (
              <p className="text-center text-xs text-[var(--muted-foreground)]">
                Tap an answer above to continue.
              </p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );

  const previewColumn =
    showLivePreview && reviewContent ? (
      <DraftItineraryPreview
        content={reviewContent}
        language={result?.brief?.language ?? "en"}
        clientName={result?.brief?.client_name}
        saving={saving}
        onBack={backToOptions}
        onSavePreview={() => void saveReviewedDraft("preview")}
        onSaveEditor={() => void saveReviewedDraft("editor")}
      />
    ) : (
      <div className="flex h-full flex-col items-center justify-center gap-2 bg-[#c8c4bc]/90 p-6 text-center">
        <p className="text-sm font-medium text-foreground/80">Guest itinerary preview</p>
        <p className="max-w-xs text-xs text-muted-foreground">
          After hotels and cost lines, the Classic Luxury PDF appears here live.
        </p>
      </div>
    );

  return (
    <div className="proposal-workspace flex min-h-0 flex-1 flex-col">
      {/* Mobile controls */}
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border bg-card px-3 py-2 lg:hidden">
        <div className="flex rounded-lg border border-border p-0.5">
          <button
            type="button"
            className={cn(
              "rounded-md px-3 py-1 text-xs font-medium",
              mobileTab === "chat" ? "bg-primary text-primary-foreground" : "text-muted-foreground",
            )}
            onClick={() => setMobileTab("chat")}
          >
            Chat
          </button>
          <button
            type="button"
            className={cn(
              "rounded-md px-3 py-1 text-xs font-medium",
              mobileTab === "itinerary"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground",
            )}
            onClick={() => setMobileTab("itinerary")}
            disabled={!showLivePreview}
          >
            Itinerary
          </button>
        </div>
        <div className="flex rounded-lg border border-border p-0.5">
          <button
            type="button"
            className={cn(
              "rounded-md px-2 py-1 text-[10px] font-medium uppercase tracking-wide",
              mobileLayout === "tabs" ? "bg-muted text-foreground" : "text-muted-foreground",
            )}
            onClick={() => setMobileLayoutPersist("tabs")}
          >
            Tabs
          </button>
          <button
            type="button"
            className={cn(
              "rounded-md px-2 py-1 text-[10px] font-medium uppercase tracking-wide",
              mobileLayout === "stacked" ? "bg-muted text-foreground" : "text-muted-foreground",
            )}
            onClick={() => setMobileLayoutPersist("stacked")}
          >
            Stacked
          </button>
        </div>
      </div>

      {/* Desktop: full chat until draft, then 30/70 */}
      <div
        className={cn(
          "hidden min-h-0 flex-1 lg:grid",
          showSplitDesktop ? "lg:grid-cols-[3fr_7fr]" : "lg:grid-cols-1",
        )}
      >
        <div className={cn("min-h-0", showSplitDesktop && "border-r border-border")}>
          {chatColumn}
        </div>
        {showSplitDesktop ? <div className="min-h-0">{previewColumn}</div> : null}
      </div>

      {/* Mobile tabs */}
      {mobileLayout === "tabs" ? (
        <div className="flex min-h-0 flex-1 flex-col lg:hidden">
          {mobileTab === "chat" ? chatColumn : previewColumn}
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col lg:hidden">
          <div className="min-h-0 flex-[0.48] overflow-hidden border-b border-border">
            {previewColumn}
          </div>
          <div className="min-h-0 flex-[0.52] overflow-hidden">{chatColumn}</div>
        </div>
      )}

      <HotelPickModal
        open={hotelModalOpen && showHotelStep}
        brief={result?.brief}
        usedDefaults={usedDefaults}
        hotelChoices={result?.hotelChoices}
        options={result?.options}
        compare={result?.compare}
        warning={result?.warning}
        selections={hotelSelections}
        selectedId={selectedId}
        canGenerate={canGenerate}
        generating={generating}
        onSelectionsChange={setHotelSelections}
        onSelectPackage={setSelectedId}
        onEditBrief={() => {
          setHotelModalOpen(false);
          setBriefConfirm(true);
          setDeskReady(false);
        }}
        onGenerate={() => void runFullGenerate()}
        onClose={() => setHotelModalOpen(false)}
      />

      <TripWizard
        open={wizardOpen}
        audience={isB2c ? "traveler" : "agent"}
        onClose={() => setWizardOpen(false)}
        onComplete={(wizardBrief) => {
          setWizardOpen(false);
          void submitUserMessage(wizardBrief);
        }}
      />
    </div>
  );
}
