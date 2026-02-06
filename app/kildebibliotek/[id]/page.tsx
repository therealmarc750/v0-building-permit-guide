"use client";

import React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Loader2,
  ExternalLink,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Plus,
} from "lucide-react";
import type { Source, SourceStatus, SourceCategory, FlowType, ReviewFlags, RuleCandidate } from "@/lib/sources/types";
import { CATEGORY_LABELS, STATUS_LABELS, FLOW_LABELS, REVIEW_FLAG_LABELS, DEFAULT_REVIEW_FLAGS } from "@/lib/sources/types";
import { Checkbox } from "@/components/ui/checkbox";

function StatusBadge({ status }: { status: SourceStatus }) {
  const config: Record<SourceStatus, { className: string; icon: React.ReactNode }> = {
    ubehandlet: {
      className: "bg-muted text-muted-foreground",
      icon: <Clock className="h-3 w-3" />,
    },
    godkjent: {
      className: "bg-success/15 text-success",
      icon: <CheckCircle2 className="h-3 w-3" />,
    },
    avvist: {
      className: "bg-destructive/15 text-destructive",
      icon: <XCircle className="h-3 w-3" />,
    },
  };

  return (
    <Badge className={`${config[status].className} border-0 gap-1`}>
      {config[status].icon}
      {STATUS_LABELS[status]}
    </Badge>
  );
}

export default function SourceDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const router = useRouter();
  const [source, setSource] = useState<Source | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refetching, setRefetching] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [candidates, setCandidates] = useState<RuleCandidate[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(true);
  const [generatingCandidates, setGeneratingCandidates] = useState(false);
  const [candidateError, setCandidateError] = useState("");
  const [chunks, setChunks] = useState<Array<{ id: string; ordinal: number; heading: string | null; text: string }>>([]);
  const [loadingChunks, setLoadingChunks] = useState(true);
  const [creatingRuleForChunk, setCreatingRuleForChunk] = useState<string | null>(null);
  const [ruleProjectType, setRuleProjectType] = useState("garasje");
  const [ruleOutcome, setRuleOutcome] = useState<"søknadspliktig" | "unntatt" | "avhenger">("avhenger");
  const [ruleTitle, setRuleTitle] = useState("");
  const [ruleExplanation, setRuleExplanation] = useState("");
  const [ruleConditions, setRuleConditions] = useState("{}");
  const [ruleIsActive, setRuleIsActive] = useState(false);
  const [ruleError, setRuleError] = useState("");

  // Editable fields
  const [category, setCategory] = useState<SourceCategory | "none">("none");
  const [tags, setTags] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [curatorSummary, setCuratorSummary] = useState("");
  const [reviewFlags, setReviewFlags] = useState<ReviewFlags>({ ...DEFAULT_REVIEW_FLAGS });
  const [keyExcerpts, setKeyExcerpts] = useState<string[]>([]);
  const [relatedFlows, setRelatedFlows] = useState<FlowType[]>([]);
  const [newExcerpt, setNewExcerpt] = useState("");

  useEffect(() => {
    fetchSource();
    fetchCandidates();
    fetchChunks();
  }, [id]);

  async function fetchChunks() {
    setLoadingChunks(true);
    try {
      const res = await fetch(`/api/sources/${id}/chunks`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Kunne ikke hente tekstblokker");
      }
      setChunks(data);
    } catch (error) {
      console.error("Failed to fetch chunks:", error);
    } finally {
      setLoadingChunks(false);
    }
  }

  async function fetchSource() {
    try {
      const res = await fetch(`/api/sources/${id}`);
      if (!res.ok) {
        router.push("/kildebibliotek");
        return;
      }
      const data = await res.json();
      setSource(data);
      setCategory(data.category || "none");
      setTags(data.tags.join(", "));
      setInternalNotes(data.internalNotes);
      setCuratorSummary(data.curatorSummary);
      setReviewFlags(data.reviewFlags || { ...DEFAULT_REVIEW_FLAGS });
      setKeyExcerpts(data.keyExcerpts || []);
      setRelatedFlows(data.relatedFlows || []);
    } catch (error) {
      console.error("Failed to fetch source:", error);
      router.push("/kildebibliotek");
    } finally {
      setLoading(false);
    }
  }

  async function fetchCandidates() {
    setLoadingCandidates(true);
    try {
      const res = await fetch(`/api/sources/${id}/candidates`);
      if (!res.ok) {
        throw new Error("Kunne ikke hente regelutkast");
      }
      const data = await res.json();
      setCandidates(data);
    } catch (error) {
      console.error("Failed to fetch candidates:", error);
    } finally {
      setLoadingCandidates(false);
    }
  }

  async function handleGenerateCandidates() {
    setGeneratingCandidates(true);
    setCandidateError("");
    try {
      const res = await fetch(`/api/sources/${id}/generate-candidates`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Kunne ikke generere regelutkast");
      }
      await fetchCandidates();
    } catch (error) {
      setCandidateError(error instanceof Error ? error.message : "Ukjent feil");
    } finally {
      setGeneratingCandidates(false);
    }
  }

  async function handleCandidateStatus(candidateId: string, status: "approved" | "rejected") {
    setCandidateError("");
    try {
      const res = await fetch(`/api/rule-candidates/${candidateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Kunne ikke oppdatere regelutkast");
      }
      await fetchCandidates();
    } catch (error) {
      setCandidateError(error instanceof Error ? error.message : "Ukjent feil");
    }
  }

  async function handleSave() {
    if (!source) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/sources/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: category === "none" ? null : category,
          tags: tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          internalNotes,
          curatorSummary,
          reviewFlags,
          keyExcerpts,
          relatedFlows,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setSource(updated);
      }
    } catch (error) {
      console.error("Failed to save:", error);
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(newStatus: SourceStatus) {
    if (!source) return;

    try {
      const res = await fetch(`/api/sources/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        const updated = await res.json();
        setSource(updated);
      }
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  }

  async function handleRefetch() {
    if (!source) return;

    setRefetching(true);
    try {
      const fetchRes = await fetch("/api/sources/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: source.url }),
      });

      if (!fetchRes.ok) {
        const payload = await fetchRes.json();
        throw new Error(payload.error || "Failed to refetch");
      }
      await fetchSource();
      await fetchChunks();
    } catch (error) {
      console.error("Failed to refetch:", error);
    } finally {
      setRefetching(false);
    }
  }

  async function handleCreateRuleFromChunk(chunkId: string) {
    setRuleError("");
    let parsedConditions: unknown = {};
    try {
      parsedConditions = JSON.parse(ruleConditions);
    } catch {
      setRuleError("Ugyldig JSON i vilkår");
      return;
    }

    try {
      const res = await fetch(`/api/sources/${id}/rules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chunkId,
          projectType: ruleProjectType,
          outcome: ruleOutcome,
          title: ruleTitle,
          explanation: ruleExplanation,
          conditions: parsedConditions,
          isActive: ruleIsActive,
          priority: 100,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Kunne ikke opprette regel");
      }
      setCreatingRuleForChunk(null);
      setRuleTitle("");
      setRuleExplanation("");
      setRuleConditions("{}");
    } catch (error) {
      setRuleError(error instanceof Error ? error.message : "Ukjent feil");
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/sources/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.push("/kildebibliotek");
      }
    } catch (error) {
      console.error("Failed to delete:", error);
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!source) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto max-w-4xl px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <Link
                href="/kildebibliotek"
                className="mt-1 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-xl font-semibold text-foreground">
                    {source.title}
                  </h1>
                  <StatusBadge status={source.status} />
                </div>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  {source.url}
                </a>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8">
        {source.fetchStatus === "failed" && (
          <div className="mb-6 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            Kunne ikke hente innhold: {source.fetchError || "Ukjent feil"}
          </div>
        )}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg">Regelutkast</CardTitle>
                    <CardDescription>
                      Utkast generert fra kildeteksten. Godkjenn for å legge til i veiledningen.
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleGenerateCandidates}
                    disabled={generatingCandidates}
                  >
                    {generatingCandidates ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Genererer...
                      </>
                    ) : (
                      "Generer regelutkast"
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {candidateError && (
                  <div className="rounded border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                    {candidateError}
                  </div>
                )}
                {loadingCandidates ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Laster regelutkast...
                  </div>
                ) : candidates.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Ingen regelutkast funnet for denne kilden.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {candidates.map((candidate) => (
                      <div key={candidate.id} className="rounded-lg border p-4 space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-medium">{candidate.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {candidate.explanation}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {candidate.outcome}
                          </Badge>
                        </div>

                        <div className="rounded bg-muted/40 p-3 text-xs text-muted-foreground">
                          <p className="font-medium text-foreground mb-1">Vilkår</p>
                          <pre className="whitespace-pre-wrap">
                            {JSON.stringify(candidate.conditions, null, 2)}
                          </pre>
                        </div>

                        {candidate.citations.length > 0 && (
                          <div className="space-y-2 text-sm">
                            <p className="text-xs font-medium text-muted-foreground">Sitat</p>
                            {candidate.citations.map((citation, index) => (
                              <div key={`${candidate.id}-${index}`} className="rounded border p-3">
                                <p className="text-sm italic text-muted-foreground">
                                  &quot;{citation.excerpt}&quot;
                                </p>
                                <div className="mt-2 flex flex-col gap-1 text-xs text-muted-foreground">
                                  {citation.locationHint && (
                                    <span>Plassering: {citation.locationHint}</span>
                                  )}
                                  {source?.url && (
                                    <a
                                      href={source.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1 text-primary hover:underline"
                                    >
                                      <ExternalLink className="h-3 w-3" />
                                      Åpne kilde
                                    </a>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleCandidateStatus(candidate.id, "approved")}
                            disabled={candidate.status !== "draft" || !candidate.projectType}
                          >
                            Godkjenn
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCandidateStatus(candidate.id, "rejected")}
                            disabled={candidate.status !== "draft"}
                          >
                            Avvis
                          </Button>
                          <span className="text-xs text-muted-foreground">
                            Status: {candidate.status}
                          </span>
                          {!candidate.projectType && (
                            <span className="text-xs text-amber-600">
                              Mangler prosjekttype
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Kvalitetssjekk</CardTitle>
                <CardDescription>
                  Minst 3 av 4 sjekker kreves for godkjenning
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {(Object.keys(REVIEW_FLAG_LABELS) as Array<keyof ReviewFlags>).map((key) => (
                    <label
                      key={key}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 cursor-pointer"
                    >
                      <Checkbox
                        checked={reviewFlags[key]}
                        onCheckedChange={(checked) => {
                          setReviewFlags((prev) => ({
                            ...prev,
                            [key]: checked === true,
                          }));
                        }}
                      />
                      <span className="text-sm">{REVIEW_FLAG_LABELS[key]}</span>
                    </label>
                  ))}
                </div>
                <div className="mt-4 text-sm text-muted-foreground">
                  {Object.values(reviewFlags).filter(Boolean).length} av 4 sjekker bestått
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Kurator-sammendrag</CardTitle>
                <CardDescription>
                  Skriv et sammendrag av innholdet for internt bruk
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={curatorSummary}
                  onChange={(e) => setCuratorSummary(e.target.value)}
                  placeholder="Beskriv hva denne kilden handler om og hvorfor den er relevant..."
                  className="min-h-[120px]"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Interne notater</CardTitle>
                <CardDescription>
                  Notater som ikke vises for brukere
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  placeholder="F.eks. merknader om gyldighet, forbehold, eller oppfølging..."
                  className="min-h-[100px]"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Nøkkelutdrag</CardTitle>
                <CardDescription>
                  Marker viktige utdrag fra teksten som skal brukes i veilederen
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {keyExcerpts.length > 0 && (
                  <div className="space-y-2">
                    {keyExcerpts.map((excerpt, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20"
                      >
                        <p className="flex-1 text-sm italic">&quot;{excerpt}&quot;</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                          onClick={() => {
                            setKeyExcerpts((prev) => prev.filter((_, i) => i !== index));
                          }}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Input
                    value={newExcerpt}
                    onChange={(e) => setNewExcerpt(e.target.value)}
                    placeholder="Lim inn eller skriv et viktig utdrag..."
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (newExcerpt.trim()) {
                        setKeyExcerpts((prev) => [...prev, newExcerpt.trim()]);
                        setNewExcerpt("");
                      }
                    }}
                    disabled={!newExcerpt.trim()}
                  >
                    Legg til
                  </Button>
                </div>
              </CardContent>
            </Card>


            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tekstblokker</CardTitle>
                <CardDescription>
                  Automatisk oppdelte seksjoner brukt for regler og sitater
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {ruleError && (
                  <div className="rounded border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                    {ruleError}
                  </div>
                )}
                {loadingChunks ? (
                  <div className="text-sm text-muted-foreground">Laster tekstblokker...</div>
                ) : chunks.length === 0 ? (
                  <div className="text-sm text-muted-foreground">Ingen tekstblokker opprettet enda.</div>
                ) : (
                  <div className="space-y-3 max-h-[420px] overflow-y-auto">
                    {chunks.map((chunk) => (
                      <div key={chunk.id} className="rounded border p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-muted-foreground">Blokk #{chunk.ordinal}</p>
                            <p className="font-medium text-sm">{chunk.heading || "Uten overskrift"}</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setCreatingRuleForChunk(chunk.id);
                              setRuleTitle(chunk.heading || "Regel fra kilde");
                              setRuleExplanation(chunk.text.slice(0, 240));
                            }}
                          >
                            <Plus className="mr-1 h-3 w-3" />
                            Lag regel
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-3">{chunk.text}</p>

                        {creatingRuleForChunk === chunk.id && (
                          <div className="rounded border bg-muted/30 p-3 space-y-2">
                            <div className="grid gap-2 md:grid-cols-2">
                              <Input
                                placeholder="Prosjekttype"
                                value={ruleProjectType}
                                onChange={(e) => setRuleProjectType(e.target.value)}
                              />
                              <Select value={ruleOutcome} onValueChange={(v) => setRuleOutcome(v as "søknadspliktig" | "unntatt" | "avhenger")}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="søknadspliktig">søknadspliktig</SelectItem>
                                  <SelectItem value="unntatt">unntatt</SelectItem>
                                  <SelectItem value="avhenger">avhenger</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <Input
                              placeholder="Regeltittel"
                              value={ruleTitle}
                              onChange={(e) => setRuleTitle(e.target.value)}
                            />
                            <Textarea
                              placeholder="Forklaring"
                              value={ruleExplanation}
                              onChange={(e) => setRuleExplanation(e.target.value)}
                            />
                            <Textarea
                              placeholder='Vilkår (JSON), f.eks {"and":[...]}'
                              value={ruleConditions}
                              onChange={(e) => setRuleConditions(e.target.value)}
                              className="font-mono text-xs"
                            />
                            <label className="flex items-center gap-2 text-sm">
                              <Checkbox checked={ruleIsActive} onCheckedChange={(v) => setRuleIsActive(v === true)} />
                              Aktiv regel
                            </label>
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => handleCreateRuleFromChunk(chunk.id)}>Lagre regel</Button>
                              <Button size="sm" variant="ghost" onClick={() => setCreatingRuleForChunk(null)}>Avbryt</Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Utdrag av innhold</CardTitle>
                <CardDescription>
                  Automatisk hentet tekst fra kilden (klikk for å kopiere utdrag)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md bg-muted p-4 text-sm text-muted-foreground max-h-[400px] overflow-y-auto space-y-3">
                  {source.extractedText.split("\n\n").map((paragraph, index) => (
                    <p
                      key={index}
                      className="cursor-pointer hover:bg-primary/10 hover:text-foreground p-2 rounded -m-2 transition-colors"
                      onClick={() => {
                        if (paragraph.trim()) {
                          setNewExcerpt(paragraph.trim());
                        }
                      }}
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-col gap-2">
                  <Button
                    variant={source.status === "godkjent" ? "default" : "outline"}
                    className="justify-start"
                    onClick={() => handleStatusChange("godkjent")}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Godkjenn
                  </Button>
                  <Button
                    variant={source.status === "avvist" ? "destructive" : "outline"}
                    className="justify-start"
                    onClick={() => handleStatusChange("avvist")}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Avvis
                  </Button>
                  <Button
                    variant={source.status === "ubehandlet" ? "secondary" : "outline"}
                    className="justify-start"
                    onClick={() => handleStatusChange("ubehandlet")}
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    Sett ubehandlet
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Klassifisering</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Kategori</Label>
                  <Select
                    value={category}
                    onValueChange={(v) => setCategory(v as SourceCategory | "none")}
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Velg kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Ingen kategori</SelectItem>
                      {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">Tags</Label>
                  <Input
                    id="tags"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="TEK17, garasje, unntak"
                  />
                  <p className="text-xs text-muted-foreground">Kommaseparert</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Relaterte flyter</CardTitle>
                <CardDescription>
                  Hvilke byggesakstyper gjelder denne kilden for?
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(Object.keys(FLOW_LABELS) as FlowType[]).map((flow) => (
                    <label
                      key={flow}
                      className="flex items-center gap-3 p-2 rounded hover:bg-muted/50 cursor-pointer"
                    >
                      <Checkbox
                        checked={relatedFlows.includes(flow)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setRelatedFlows((prev) => [...prev, flow]);
                          } else {
                            setRelatedFlows((prev) => prev.filter((f) => f !== flow));
                          }
                        }}
                      />
                      <span className="text-sm">{FLOW_LABELS[flow]}</span>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Metadata</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Domene</span>
                  <span>{source.domain}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Hentestatus</span>
                  <span>{source.fetchStatus || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Hentet</span>
                  <span>{source.fetchedAt ? new Date(source.fetchedAt).toLocaleString("no-NO") : "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Opprettet</span>
                  <span>{new Date(source.createdAt).toLocaleDateString("no-NO")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Oppdatert</span>
                  <span>{new Date(source.updatedAt).toLocaleDateString("no-NO")}</span>
                </div>
                {source.error && (
                  <div className="rounded border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
                    {source.error}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-3">
              <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Lagrer...
                  </>
                ) : (
                  "Lagre endringer"
                )}
              </Button>

              <Button
                variant="outline"
                onClick={handleRefetch}
                disabled={refetching}
                className="w-full bg-transparent"
              >
                {refetching ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Henter på nytt...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Hent innhold på nytt
                  </>
                )}
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="w-full text-destructive bg-transparent">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Slett kilde
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Er du sikker?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Dette vil permanent slette kilden &quot;{source.title}&quot;.
                      Handlingen kan ikke angres.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Avbryt</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      disabled={deleting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {deleting ? "Sletter..." : "Slett"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
