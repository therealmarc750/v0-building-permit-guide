"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  ExternalLink,
  RotateCcw,
} from "lucide-react";
import {
  evaluateGarasjeRules,
  type GarasjeAnswers,
  type RuleResult,
  type ResultCategory,
} from "@/lib/veileder/garasje-rules";

interface Question {
  id: keyof GarasjeAnswers;
  text: string;
  helpText: string;
  type: "radio" | "number";
  options?: { value: string; label: string }[];
  unit?: string;
  min?: number;
  max?: number;
}

const questions: Question[] = [
  {
    id: "type",
    text: "Hva skal du bygge?",
    helpText: "En garasje har vegger på alle sider, mens en carport har åpne sider.",
    type: "radio",
    options: [
      { value: "garasje", label: "Garasje (lukket)" },
      { value: "carport", label: "Carport (åpen)" },
    ],
  },
  {
    id: "area",
    text: "Hvor stort skal bygget være?",
    helpText: "Oppgi bruksareal i kvadratmeter. For søknadsfrihet er grensen normalt 50 m².",
    type: "number",
    unit: "m²",
    min: 1,
    max: 500,
  },
  {
    id: "floors",
    text: "Hvor mange etasjer skal bygget ha?",
    helpText: "Antall hele etasjer over bakkenivå. Loft som ikke er innredet teller ikke.",
    type: "radio",
    options: [
      { value: "1", label: "1 etasje" },
      { value: "2", label: "2 eller flere etasjer" },
    ],
  },
  {
    id: "basement",
    text: "Skal det være kjeller eller underetasje?",
    helpText: "En kjeller er en etasje der mer enn halvparten av høyden er under terreng.",
    type: "radio",
    options: [
      { value: "nei", label: "Nei" },
      { value: "ja", label: "Ja" },
      { value: "vet-ikke", label: "Vet ikke" },
    ],
  },
  {
    id: "height",
    text: "Omtrent hvor høyt blir bygget?",
    helpText: "Mål mønehøyde fra gjennomsnittlig terrengnivå til høyeste punkt. For søknadsfrihet er grensen normalt 4 meter.",
    type: "number",
    unit: "meter",
    min: 1,
    max: 15,
  },
  {
    id: "distance",
    text: "Hvor langt fra nabogrensen skal bygget stå?",
    helpText: "Mål korteste avstand fra yttervegg til nabogrense. Minimum 1 meter kreves normalt for søknadsfrihet.",
    type: "number",
    unit: "meter",
    min: 0,
    max: 100,
  },
  {
    id: "habitation",
    text: "Skal bygget brukes til beboelse?",
    helpText: "Beboelse betyr at noen skal bo eller sove der. En vanlig garasje/carport er ikke til beboelse.",
    type: "radio",
    options: [
      { value: "nei", label: "Nei, kun til bil/oppbevaring" },
      { value: "ja", label: "Ja, det skal være beboelse" },
    ],
  },
  {
    id: "propertyType",
    text: "Er dette på en enebolig eller småhustomt?",
    helpText: "Småhus inkluderer eneboliger, tomannsboliger og rekkehus. Reglene for søknadsfrihet gjelder primært for slike eiendommer.",
    type: "radio",
    options: [
      { value: "ja", label: "Ja" },
      { value: "nei", label: "Nei" },
      { value: "usikker", label: "Usikker" },
    ],
  },
];

interface ApprovedSource {
  id: string;
  title: string;
  url: string;
  curator_summary: string | null;
}

export default function GarasjeVeilederPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<GarasjeAnswers>>({});
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<RuleResult | null>(null);
  const [sources, setSources] = useState<ApprovedSource[]>([]);
  const [loadingSources, setLoadingSources] = useState(false);

  const currentQuestion = questions[currentStep];
  const totalSteps = questions.length;

  const hasCurrentAnswer = () => {
    const value = answers[currentQuestion.id];
    if (currentQuestion.type === "number") {
      return value !== undefined && value !== null && value !== "";
    }
    return value !== undefined && value !== "";
  };

  const handleAnswer = (value: string | number) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: value,
    }));
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      // Calculate result
      const fullAnswers: GarasjeAnswers = {
        type: (answers.type as "garasje" | "carport") || "garasje",
        area: answers.area !== undefined && answers.area !== "" ? Number(answers.area) : null,
        floors: answers.floors ? Number(answers.floors) : 1,
        basement: (answers.basement as "ja" | "nei" | "vet-ikke") || "nei",
        height: answers.height !== undefined && answers.height !== "" ? Number(answers.height) : null,
        distance: answers.distance !== undefined && answers.distance !== "" ? Number(answers.distance) : null,
        habitation: (answers.habitation as "ja" | "nei") || "nei",
        propertyType: (answers.propertyType as "ja" | "nei" | "usikker") || "usikker",
      };

      const ruleResult = evaluateGarasjeRules(fullAnswers);
      setResult(ruleResult);
      setShowResult(true);
      fetchSources();
    }
  };

  const handleBack = () => {
    if (showResult) {
      setShowResult(false);
    } else if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    } else {
      router.push("/veileder");
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
    setAnswers({});
    setShowResult(false);
    setResult(null);
    setSources([]);
  };

  const fetchSources = async () => {
    setLoadingSources(true);
    try {
      const res = await fetch("/api/sources/approved?flow=garasje");
      if (res.ok) {
        const data = await res.json();
        setSources(data);
      }
    } catch (error) {
      console.error("Error fetching sources:", error);
    } finally {
      setLoadingSources(false);
    }
  };

  const getResultIcon = (category: ResultCategory) => {
    switch (category) {
      case "soknadsfritt":
        return <CheckCircle2 className="h-8 w-8 text-green-600" />;
      case "soknadspliktig-selv":
        return <AlertTriangle className="h-8 w-8 text-amber-500" />;
      case "soknadspliktig-ansvarlig":
        return <XCircle className="h-8 w-8 text-red-500" />;
      case "uavklart":
        return <HelpCircle className="h-8 w-8 text-muted-foreground" />;
    }
  };

  const getResultBadgeVariant = (category: ResultCategory) => {
    switch (category) {
      case "soknadsfritt":
        return "bg-green-100 text-green-800 border-green-200";
      case "soknadspliktig-selv":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "soknadspliktig-ansvarlig":
        return "bg-red-100 text-red-800 border-red-200";
      case "uavklart":
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Result screen
  if (showResult && result) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="mx-auto max-w-3xl px-4 py-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="gap-2 -ml-2 mb-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Tilbake til spørsmål
            </Button>
            <h1 className="text-xl font-semibold text-foreground">
              Ditt resultat
            </h1>
          </div>
        </header>

        <main className="mx-auto max-w-3xl px-4 py-8 space-y-6">
          {/* Dev banner */}
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
            <strong>Pilotmodus:</strong> Reglene er forenklet og gir kun en indikasjon. Kilder vises kun når de er godkjent i Kildebibliotek.
          </div>

          {/* Result badge */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                {getResultIcon(result.category)}
                <div className="flex-1 space-y-2">
                  <Badge
                    variant="outline"
                    className={`text-sm px-3 py-1 ${getResultBadgeVariant(result.category)}`}
                  >
                    {result.categoryLabel}
                  </Badge>
                  <p className="text-muted-foreground">
                    {result.categoryDescription}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Conditions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Dette forutsetter at</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {result.conditions.map((condition, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <span className="text-sm text-foreground">{condition}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Next steps */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Neste steg</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3">
                {result.nextSteps.map((step, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                      {index + 1}
                    </span>
                    <span className="text-sm text-foreground">{step}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          {/* Sources */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Kilder</CardTitle>
              <CardDescription>
                Godkjente kilder fra Kildebiblioteket for Garasje/Carport
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingSources ? (
                <p className="text-sm text-muted-foreground">Laster kilder...</p>
              ) : sources.length > 0 ? (
                <Accordion type="single" collapsible className="w-full">
                  {sources.map((source) => (
                    <AccordionItem key={source.id} value={source.id}>
                      <AccordionTrigger className="text-sm text-left">
                        {source.title}
                      </AccordionTrigger>
                      <AccordionContent>
                        {source.curator_summary && (
                          <p className="text-sm text-muted-foreground mb-3">
                            {source.curator_summary}
                          </p>
                        )}
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                        >
                          Les mer
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
                  <p>
                    Ingen godkjente kilder funnet for Garasje/Carport ennå.
                  </p>
                  <p className="mt-2">
                    <a
                      href="/kildebibliotek"
                      className="text-primary hover:underline"
                    >
                      Gå til Kildebibliotek
                    </a>{" "}
                    og godkjenn minst én kilde med &quot;garasje&quot; i relaterte flyter.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={handleReset}
              className="gap-2 bg-transparent"
            >
              <RotateCcw className="h-4 w-4" />
              Start på nytt
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/")}
            >
              Tilbake til forsiden
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // Question wizard
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-3xl px-4 py-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="gap-2 -ml-2 mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Tilbake
          </Button>
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-foreground">
              Garasje eller carport
            </h1>
            <span className="text-sm text-muted-foreground">
              Spørsmål {currentStep + 1} av {totalSteps}
            </span>
          </div>
          {/* Progress bar */}
          <div className="mt-4 h-1.5 w-full rounded-full bg-muted">
            <div
              className="h-1.5 rounded-full bg-primary transition-all duration-300"
              style={{
                width: `${((currentStep + 1) / totalSteps) * 100}%`,
              }}
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        {/* Dev banner */}
        <div className="mb-6 rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
          <strong>Pilotmodus:</strong> Reglene er forenklet. Kilder vises kun når de er godkjent i Kildebibliotek.
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium text-balance">
              {currentQuestion.text}
            </CardTitle>
            <CardDescription className="flex items-start gap-2">
              <HelpCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>Hvorfor spør vi? {currentQuestion.helpText}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Radio options */}
            {currentQuestion.type === "radio" && currentQuestion.options && (
              <RadioGroup
                value={answers[currentQuestion.id]?.toString() ?? ""}
                onValueChange={(value) => handleAnswer(value)}
                className="flex flex-col gap-3"
              >
                {currentQuestion.options.map((option) => (
                  <Label
                    key={option.value}
                    htmlFor={`${currentQuestion.id}-${option.value}`}
                    className="flex items-center gap-3 rounded-lg border border-border p-4 cursor-pointer hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                  >
                    <RadioGroupItem
                      value={option.value}
                      id={`${currentQuestion.id}-${option.value}`}
                    />
                    {option.label}
                  </Label>
                ))}
              </RadioGroup>
            )}

            {/* Number input */}
            {currentQuestion.type === "number" && (
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  placeholder="0"
                  min={currentQuestion.min}
                  max={currentQuestion.max}
                  value={answers[currentQuestion.id]?.toString() ?? ""}
                  onChange={(e) =>
                    handleAnswer(e.target.value ? Number(e.target.value) : "")
                  }
                  className="max-w-32"
                />
                {currentQuestion.unit && (
                  <span className="text-muted-foreground">
                    {currentQuestion.unit}
                  </span>
                )}
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-end pt-4">
              <Button
                onClick={handleNext}
                disabled={!hasCurrentAnswer()}
                className="gap-2"
              >
                {currentStep < totalSteps - 1 ? (
                  <>
                    Neste
                    <ArrowRight className="h-4 w-4" />
                  </>
                ) : (
                  "Se resultat"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
