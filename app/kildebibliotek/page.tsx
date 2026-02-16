"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, ExternalLink, ArrowLeft } from "lucide-react";
import type { Source, SourceStatus, SourceCategory, FlowType, ReviewFlags } from "@/lib/sources/types";
import { CATEGORY_LABELS, STATUS_LABELS, FLOW_LABELS } from "@/lib/sources/types";
import { CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { useSearchParams } from "next/navigation";
import Loading from "./loading";

function StatusBadge({ status }: { status: SourceStatus }) {
  const variants: Record<SourceStatus, string> = {
    ubehandlet: "bg-muted text-muted-foreground",
    godkjent: "bg-success/15 text-success",
    avvist: "bg-destructive/15 text-destructive",
  };

  return (
    <Badge className={`${variants[status]} border-0`}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}

function FetchStatusBadge({ status }: { status?: Source["fetchStatus"] }) {
  const label =
    status === "failed"
      ? "Feilet"
      : status === "fetched"
        ? "Hentet"
        : status === "fetching"
          ? "Henter"
          : "I kø";
  const className =
    status === "failed"
      ? "bg-destructive/15 text-destructive"
      : status === "fetched"
        ? "bg-success/15 text-success"
        : status === "fetching"
          ? "bg-amber-500/15 text-amber-700"
          : "bg-muted text-muted-foreground";

  return <Badge className={`${className} border-0`}>{label}</Badge>;
}

export default function KildebibliotekPage() {
  const router = useRouter();
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<SourceStatus | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<SourceCategory | "all">("all");
  const [reviewFilter, setReviewFilter] = useState<"all" | "complete" | "incomplete">("all");
  const [flowFilter, setFlowFilter] = useState<FlowType | "all">("all");
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const searchParams = useSearchParams();

  // Helper to check if review is complete (3/4 checks)
  function isReviewComplete(flags: ReviewFlags | undefined): boolean {
    if (!flags) return false;
    return Object.values(flags).filter(Boolean).length >= 3;
  }

  useEffect(() => {
    fetchSources();
  }, []);

  async function fetchSources() {
    try {
      const res = await fetch("/api/sources");
      const data = await res.json();
      setSources(data);
    } catch (error) {
      console.error("Failed to fetch sources:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateCandidates(sourceId: string) {
    setGeneratingId(sourceId);
    try {
      await fetch(`/api/sources/${sourceId}/generate-candidates`, {
        method: "POST",
      });
    } catch (error) {
      console.error("Failed to generate candidates:", error);
    } finally {
      setGeneratingId(null);
    }
  }

  const filteredSources = sources.filter((source) => {
    const matchesSearch =
      search === "" ||
      source.title.toLowerCase().includes(search.toLowerCase()) ||
      source.url.toLowerCase().includes(search.toLowerCase()) ||
      source.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus =
      statusFilter === "all" || source.status === statusFilter;

    const matchesCategory =
      categoryFilter === "all" || source.category === categoryFilter;

    const matchesReview =
      reviewFilter === "all" ||
      (reviewFilter === "complete" && isReviewComplete(source.reviewFlags)) ||
      (reviewFilter === "incomplete" && !isReviewComplete(source.reviewFlags));

    const matchesFlow =
      flowFilter === "all" ||
      (source.relatedFlows && source.relatedFlows.includes(flowFilter));

    return matchesSearch && matchesStatus && matchesCategory && matchesReview && matchesFlow;
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-foreground">Kildebibliotek</h1>
              <p className="text-sm text-muted-foreground">
                Administrer kilder for byggesøknad-veilederen
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Søk i tittel, URL eller tags..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as SourceStatus | "all")}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle statuser</SelectItem>
                <SelectItem value="ubehandlet">Ubehandlet</SelectItem>
                <SelectItem value="godkjent">Godkjent</SelectItem>
                <SelectItem value="avvist">Avvist</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={categoryFilter}
              onValueChange={(v) => setCategoryFilter(v as SourceCategory | "all")}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle kategorier</SelectItem>
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={reviewFilter}
              onValueChange={(v) => setReviewFilter(v as "all" | "complete" | "incomplete")}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Kvalitetssjekk" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle</SelectItem>
                <SelectItem value="complete">Kvalitetssjekket</SelectItem>
                <SelectItem value="incomplete">Mangler sjekk</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={flowFilter}
              onValueChange={(v) => setFlowFilter(v as FlowType | "all")}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Flyt" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle flyter</SelectItem>
                {Object.entries(FLOW_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={() => router.push("/kildebibliotek/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Legg til kilde
          </Button>
        </div>

        {loading ? (
          <Loading />
        ) : filteredSources.length === 0 ? (
          <div className="rounded-lg border bg-card p-12 text-center">
            <p className="text-muted-foreground">
              {sources.length === 0
                ? "Ingen kilder er lagt til ennå."
                : "Ingen kilder matcher filteret."}
            </p>
            {sources.length === 0 && (
              <Button className="mt-4" onClick={() => router.push("/kildebibliotek/new")}>
                Legg til din første kilde
              </Button>
            )}
          </div>
        ) : (
          <div className="rounded-lg border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[35%]">Tittel</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Sjekk</TableHead>
                  <TableHead>Flyter</TableHead>
                  <TableHead>Innhenting</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Utkast</TableHead>
                  <TableHead>Oppdatert</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSources.map((source) => (
                  <TableRow key={source.id}>
                    <TableCell>
                      <Link
                        href={`/kildebibliotek/${source.id}`}
                        className="font-medium text-foreground hover:text-primary hover:underline"
                      >
                        {source.title}
                      </Link>
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <ExternalLink className="h-3 w-3" />
                        <span className="truncate max-w-[300px]">{source.url}</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground/80">
                        Domene: {source.domain} · Hentet: {source.fetchedAt ? new Date(source.fetchedAt).toLocaleString("no-NO") : "-"}
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
                        {source.extractedText?.slice(0, 150) || "Ingen innhold hentet"}
                        {source.extractedText && source.extractedText.length > 150 ? "..." : ""}
                      </p>
                      <div className="mt-1 text-xs text-muted-foreground/70">
                        {source.extractedText ? `${Math.round(source.extractedText.length / 1000)}k tegn lagret` : ""}
                      </div>
                      {source.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {source.tags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="text-xs px-1.5 py-0"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {source.category ? (
                        <Badge variant="outline" className="text-xs">
                          {CATEGORY_LABELS[source.category]}
                        </Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isReviewComplete(source.reviewFlags) ? (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle2 className="h-4 w-4" />
                          <span className="text-xs">
                            {source.reviewFlags ? Object.values(source.reviewFlags).filter(Boolean).length : 0}/4
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-amber-500">
                          <AlertCircle className="h-4 w-4" />
                          <span className="text-xs">
                            {source.reviewFlags ? Object.values(source.reviewFlags).filter(Boolean).length : 0}/4
                          </span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {source.relatedFlows && source.relatedFlows.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {source.relatedFlows.slice(0, 2).map((flow) => (
                            <Badge key={flow} variant="secondary" className="text-xs px-1.5 py-0">
                              {FLOW_LABELS[flow]}
                            </Badge>
                          ))}
                          {source.relatedFlows.length > 2 && (
                            <span className="text-xs text-muted-foreground">
                              +{source.relatedFlows.length - 2}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <FetchStatusBadge status={source.fetchStatus} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={source.status} />
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleGenerateCandidates(source.id)}
                        disabled={generatingId === source.id}
                        className="gap-2"
                      >
                        <RefreshCw className="h-3 w-3" />
                        {generatingId === source.id ? "Genererer..." : "Generer"}
                      </Button>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(source.updatedAt).toLocaleDateString("no-NO")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="mt-4 text-sm text-muted-foreground">
          Viser {filteredSources.length} av {sources.length} kilder
        </div>
      </main>
    </div>
  );
}
