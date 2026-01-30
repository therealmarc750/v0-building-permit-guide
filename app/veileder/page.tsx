"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ArrowRight, Home, Layers, Hammer, Building2 } from "lucide-react";

export default function VeilederStartPage() {
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [showSelection, setShowSelection] = useState(false);

  const handleDescriptionSubmit = () => {
    const text = description.toLowerCase();
    
    // Keyword routing
    if (text.includes("garasje") || text.includes("carport")) {
      router.push("/veileder/garasje");
      return;
    }
    
    if (text.includes("vindu") || text.includes("fasade") || text.includes("kjeller")) {
      // Future: router.push("/veileder/fasade");
      setShowSelection(true);
      return;
    }
    
    // No keyword match - show selection
    setShowSelection(true);
  };

  const flowOptions = [
    {
      id: "garasje",
      title: "Garasje eller carport",
      description: "Frittliggende bygg for bil",
      icon: Home,
      href: "/veileder/garasje",
      available: true,
    },
    {
      id: "tilbygg",
      title: "Tilbygg",
      description: "Utvide eksisterende bolig",
      icon: Building2,
      href: "/veileder/tilbygg",
      available: false,
    },
    {
      id: "fasade",
      title: "Fasadeendring",
      description: "Vindu, dør eller annen endring",
      icon: Layers,
      href: "/veileder/fasade",
      available: false,
    },
    {
      id: "riving",
      title: "Riving",
      description: "Rive eksisterende bygg",
      icon: Hammer,
      href: "/veileder/riving",
      available: false,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-3xl px-4 py-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/")}
            className="gap-2 -ml-2 mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Tilbake til start
          </Button>
          <h1 className="text-xl font-semibold text-foreground">
            Byggesøknad-veileder
          </h1>
          <p className="mt-1 text-muted-foreground">
            Finn ut om du trenger søknad for ditt byggeprosjekt
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        {/* Dev banner */}
        {process.env.NODE_ENV === "development" && (
          <div className="mb-6 rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
            <strong>Pilotmodus:</strong> Reglene er forenklet. Kilder vises kun når de er godkjent i Kildebibliotek.
          </div>
        )}

        {!showSelection ? (
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <label htmlFor="description" className="block text-sm font-medium text-foreground">
                  Beskriv tiltaket ditt
                </label>
                <Textarea
                  id="description"
                  placeholder="F.eks. 'Jeg vil bygge en carport på 35 kvadratmeter' eller 'Vi ønsker å sette opp en garasje ved siden av huset'"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={handleDescriptionSubmit}
                    disabled={!description.trim()}
                    className="gap-2"
                  >
                    Neste
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowSelection(true)}
                  >
                    Eller velg prosjekttype direkte
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-foreground">
                Velg prosjekttype
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSelection(false)}
              >
                Tilbake til beskrivelse
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {flowOptions.map((flow) => (
                <Card
                  key={flow.id}
                  className={`transition-colors ${
                    flow.available
                      ? "cursor-pointer hover:border-primary/50 hover:bg-muted/50"
                      : "opacity-60 cursor-not-allowed"
                  }`}
                  onClick={() => flow.available && router.push(flow.href)}
                >
                  <CardContent className="flex items-start gap-4 pt-6">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <flow.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-medium text-foreground">
                        {flow.title}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {flow.description}
                      </p>
                      {!flow.available && (
                        <p className="text-xs text-muted-foreground/70">
                          Kommer snart
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
