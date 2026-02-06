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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleAddSource() {
    if (!url) return;
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/sources/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Ukjent feil ved ingest");
      }

      setSuccess(`Kilde hentet. Opprettet ${data.chunks_created} tekstblokker.`);
      if (data.source?.id) {
        router.push(`/kildebibliotek/${data.source.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Feil ved ingest");
    } finally {
      setSubmitting(false);
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
                disabled={submitting}
              />
              <Button onClick={handleAddSource} disabled={!url || submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Legg til"}
              </Button>
            </div>

            {success && (
              <div className="rounded border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-700">
                {success}
              </div>
            )}

            {error && (
              <div className="rounded border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => router.push("/kildebibliotek")}>Avbryt</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
