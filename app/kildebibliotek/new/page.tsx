"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";

const ALLOWED_DOMAINS = ["oslo.kommune.no", "dibk.no"];

export default function NewSourcePage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [fetching, setFetching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fetchedData, setFetchedData] = useState<{
    url: string;
    domain: string;
    title: string;
    fetchedHtml: string;
    extractedText: string;
  } | null>(null);

  async function handleFetch() {
    if (!url) return;
    setFetching(true);
    setError("");

    try {
      const res = await fetch("/api/sources/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setFetchedData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Feil ved henting");
    } finally {
      setFetching(false);
    }
  }

  async function handleSave() {
    if (!fetchedData) return;
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...fetchedData, tags: [] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push(`/kildebibliotek/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Feil ved lagring");
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-xl">
        <button
          onClick={() => router.push("/kildebibliotek")}
          className="mb-6 flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Tilbake til biblioteket
        </button>

        <Card>
          <CardHeader>
            <CardTitle>Legg til ny kilde</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Tillatte domener: {ALLOWED_DOMAINS.join(", ")}
            </p>

            <div className="flex gap-2">
              <Input
                type="url"
                placeholder="https://dibk.no/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={fetching || !!fetchedData}
              />
              <Button onClick={handleFetch} disabled={!url || fetching || !!fetchedData}>
                {fetching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Hent"}
              </Button>
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            {fetchedData && (
              <div className="rounded border bg-muted/50 p-4 space-y-2">
                <p className="font-medium">{fetchedData.title}</p>
                <p className="text-sm text-muted-foreground">
                  {fetchedData.extractedText.slice(0, 200)}...
                </p>
                <p className="text-xs text-muted-foreground">
                  {Math.round(fetchedData.extractedText.length / 1000)}k tegn hentet
                </p>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              {fetchedData && (
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Lagre kilde
                </Button>
              )}
              <Button variant="outline" onClick={() => router.push("/kildebibliotek")}>
                Avbryt
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
