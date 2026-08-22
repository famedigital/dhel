"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import type { ItineraryContent } from "@/lib/types";
import type { ClarifyingQuestion } from "@/lib/desk/question-bank";
import { friendlyAiWarning } from "@/lib/ai/friendly-warning";
import { TripWizard } from "@/components/dhel/TripWizard";
import { HotelCompareTable } from "@/components/dhel/HotelCompareTable";
import { ProposalReviewPanel } from "@/components/dhel/ProposalReviewPanel";
import { BriefIntentForm } from "@/components/dhel/BriefIntentForm";
import { RouteHotelPicker, routeHotelsComplete, type HotelSelection } from "@/components/dhel/RouteHotelPicker";
import { stashItineraryClient } from "@/lib/offline/stash-client";

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
  const threadEndRef = useRef<HTMLDivElement>(null);

  const formGaps = useMemo(
    () => (editIntent ? findFormGaps(editIntent) : []),
    [editIntent],
  );

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
        setBriefConfirm(true);
        setDeskReady(false);
        setReviewMode(false);
        if (data.brief) setEditIntent(data.brief);
        return;
      }
      if (data.status === "needs_hotel") {
        setResult(data);
        setDeskReady(true);
        return;
      }
      setResult(data);
      if (data.content) {
        setReviewContent(JSON.parse(JSON.stringify(data.content)) as ItineraryContent);
        setReviewMode(true);
        setDeskReady(false);
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
          generationMeta: result?.generationMeta,
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

    if (questions.length > 0 && questions.every((q) => next[q.id]?.trim())) {
      const combined = questions
        .map((q) => `${q.prompt.replace(/\?$/, "")}: ${next[q.id]}`)
        .join("\n");
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
    void submitUserMessage(parts.join("\n"));
  }

  const awaitingQuestions =
    result?.status === "needs_clarification" && result.questions?.length && !editIntent;
  const hasThread = messages.length > 0 || loading;
  const answeredCount = result?.questions?.filter((q) => draftAnswers[q.id]?.trim()).length ?? 0;
  const allQuestionsAnswered =
    Boolean(result?.questions?.length) && answeredCount === (result?.questions?.length ?? 0);

  const showHotelStep =
    deskReady &&
    !reviewMode &&
    (Boolean(result?.hotelChoices?.length) || Boolean(result?.options?.length));

  const isB2c = rateTier === "b2c";

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[var(--background)]">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col px-4 sm:px-6">
          {!hasThread ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-2 py-16 text-center">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                {isB2c ? "Plan your Bhutan trip" : "Proposal desk"}
              </p>
              <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-wide sm:text-4xl">
                {isB2c ? "How do you want your Bhutan itinerary?" : "What does the client want?"}
              </h1>
              <p className="max-w-md text-sm text-[var(--muted-foreground)]">
                {isB2c
                  ? "Tell us your dates, group size, and what you love — we shape a private journey and hotels around you."
                  : "Paste WhatsApp or email — we extract details locally, you confirm, pick hotels, then Gemini drafts the template."}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-1 py-6 sm:py-8">
              <p className="mb-4 text-center text-xs text-[var(--muted-foreground)]">
                {isB2c
                  ? "Your brief · hotels · draft itinerary"
                  : "Local brief · your hotels · AI narrative"}
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
              {loading ? (
                <ChatBubble variant="received">
                  <ChatBubbleAvatar fallback="AI" />
                  <ChatBubbleMessage isLoading />
                </ChatBubble>
              ) : null}

              {awaitingQuestions ? (
                <div className="ml-10 mt-2 space-y-4 rounded-2xl bg-muted/50 px-4 py-3">
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Pick an answer for each question — or edit the form below.
                  </p>
                  {result.questions!.map((q) => (
                    <div key={q.id} className="space-y-2">
                      <p className="text-sm font-medium">{q.prompt}</p>
                      <div className="flex flex-wrap gap-2">
                        {q.options.map((opt) => {
                          const selected = draftAnswers[q.id] === opt;
                          return (
                            <Button
                              key={opt}
                              variant={selected ? "default" : "outline"}
                              size="sm"
                              disabled={loading}
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
                      disabled={loading || (!freeText.trim() && answeredCount === 0)}
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
                ) : reviewMode && reviewContent ? (
                  <motion.div
                    key="review"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6"
                  >
                    <ProposalReviewPanel
                      content={reviewContent}
                      clientReply={result?.clientReply}
                      aiProvider={result?.aiProvider}
                      source={result?.source}
                      warning={result?.warning}
                      saving={saving}
                      onChange={setReviewContent}
                      onBack={backToOptions}
                      onSave={saveReviewedDraft}
                    />
                  </motion.div>
                ) : showHotelStep ? (
                  <motion.div
                    key="hotels"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 space-y-6"
                  >
                    {result?.brief ? (
                      <div className="flex flex-wrap justify-center gap-2 text-xs text-[var(--muted-foreground)]">
                        {usedDefaults ? <Badge variant="outline">Used defaults</Badge> : null}
                        <Badge variant="outline">Local parse</Badge>
                        {result.brief.currency ? (
                          <Badge variant="outline">{result.brief.currency} quote</Badge>
                        ) : null}
                        {result.brief.nationalities?.map((n) => (
                          <Badge key={n} variant="outline">
                            {n}
                          </Badge>
                        ))}
                        {result.brief.entry_point ? (
                          <Badge variant="outline">{result.brief.entry_point} entry</Badge>
                        ) : null}
                        <Badge variant="outline">
                          {result.brief.days} days · {result.brief.pax ?? 2} pax
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs"
                          onClick={() => {
                            setBriefConfirm(true);
                            setDeskReady(false);
                          }}
                        >
                          Edit trip details
                        </Button>
                      </div>
                    ) : null}

                    {result?.hotelChoices?.length ? (
                      <RouteHotelPicker
                        choices={result.hotelChoices}
                        selections={hotelSelections}
                        onChange={setHotelSelections}
                      />
                    ) : result?.options?.length ? (
                      <>
                        <p className="text-center text-sm text-[var(--muted-foreground)]">
                          Pick a package — nothing is pre-selected.
                        </p>
                        <div className="grid gap-4 md:grid-cols-3">
                          {result.options.map((opt) => (
                            <Card
                              key={opt.id}
                              className={`cursor-pointer transition-shadow ${
                                selectedId === opt.id ? "ring-2 ring-[var(--primary)]" : ""
                              }`}
                              onClick={() => setSelectedId(opt.id)}
                            >
                              <CardHeader>
                                <CardTitle className="text-base">{opt.label}</CardTitle>
                                <CardDescription>
                                  {opt.hotel.hotel_name} · {opt.hotel.city}
                                </CardDescription>
                              </CardHeader>
                              <CardContent>
                                <p className="text-2xl font-semibold">
                                  {opt.currency} {opt.sell_per_person.toLocaleString()}
                                  <span className="text-sm font-normal text-[var(--muted-foreground)]">
                                    {" "}
                                    / person
                                  </span>
                                </p>
                                <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                                  {opt.hotel.room_type} · {opt.hotel.nights} nights
                                </p>
                              </CardContent>
                              <CardFooter>
                                <Button
                                  className="w-full"
                                  variant={selectedId === opt.id ? "default" : "secondary"}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedId(opt.id);
                                  }}
                                >
                                  Use this
                                </Button>
                              </CardFooter>
                            </Card>
                          ))}
                        </div>
                        {result.compare ? <HotelCompareTable rows={result.compare} /> : null}
                      </>
                    ) : (
                      <Alert>No hotel options in catalog for this route.</Alert>
                    )}

                    {friendlyAiWarning(result?.warning) ? (
                      <p className="text-center text-xs text-[#e8a838]">
                        Note: {friendlyAiWarning(result?.warning)}
                      </p>
                    ) : null}

                    <div className="flex flex-wrap justify-center gap-3 pb-4">
                      <Button size="lg" disabled={!canGenerate} onClick={() => void runFullGenerate()}>
                        {generating ? "Generating draft…" : "Generate draft for review"}
                      </Button>
                      <p className="w-full text-center text-xs text-[var(--muted-foreground)]">
                        Gemini only fills the itinerary template from your confirmed brief and hotels.
                        Photos come from Cloudinary catalog.
                      </p>
                    </div>
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

      {!reviewMode && !briefConfirm ? (
        <div className="shrink-0 border-t border-border/60 bg-[var(--background)]/95 px-4 py-4 backdrop-blur-sm sm:px-6">
          <div className="mx-auto w-full max-w-3xl space-y-3">
            {!awaitingQuestions ? (
              <>
                <PromptInput
                  fullWidth
                  minimal
                  className="mx-auto"
                  value={input}
                  onChange={setInput}
                  placeholder={
                    isB2c
                      ? "Describe your ideal Bhutan trip…"
                      : "Paste client WhatsApp or email…"
                  }
                  onSubmit={(message) => {
                    if (loading) return;
                    void submitUserMessage(message);
                  }}
                />
                <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 pb-1 text-xs text-[var(--muted-foreground)]">
                  <button
                    type="button"
                    className="underline-offset-2 hover:text-foreground hover:underline"
                    onClick={() => setWizardOpen(true)}
                  >
                    {isB2c ? "Prefer guided questions?" : "No message? Use wizard"}
                  </button>
                  <span>Enter to send · Shift+Enter for a new line</span>
                </div>
              </>
            ) : (
              <p className="text-center text-xs text-[var(--muted-foreground)]">
                Tap an answer above, or use the trip details form.
              </p>
            )}
          </div>
        </div>
      ) : null}

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
