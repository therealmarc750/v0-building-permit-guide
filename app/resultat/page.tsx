"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  ExternalLink,
  RotateCcw,
} from "lucide-react"
import { cn } from "@/lib/utils"

type ResultStatus = "unntak" | "selv" | "ansvarlig"

interface ResultData {
  status: ResultStatus
  title: string
  description: string
  conditions: string[]
  nextSteps: string[]
  sources: { title: string; url: string }[]
}

// Mock result calculation based on flow and answers
function calculateResult(
  flow: string,
  answers: Record<string, string | number>
): ResultData {
  // Garage flow logic
  if (flow === "garasje") {
    const areal = Number(answers.g1) || 0
    const plassering = answers.g2
    const hoyde = Number(answers.g3) || 0
    const avstandNabo = Number(answers.g4) || 0
    const regulert = answers.g5
    const spesielleHensyn = answers.g6
    const vannAvlop = answers.g7

    // Check for "unntak" (no permit needed)
    if (
      areal <= 50 &&
      plassering === "frittliggende" &&
      hoyde <= 4 &&
      avstandNabo >= 1 &&
      regulert !== "ja" &&
      spesielleHensyn !== "ja" &&
      vannAvlop !== "ja"
    ) {
      return {
        status: "unntak",
        title: "Du trenger trolig ikke å søke",
        description:
          "Basert på dine svar ser det ut til at garasjen/carporten kan bygges uten søknad. Du må likevel følge gjeldende regler.",
        conditions: [
          "Bygget må ikke overstige 50 m² bruksareal (BRA)",
          "Bygget må være frittliggende og i én etasje",
          "Mønehøyde maks 4,0 m og gesimshøyde maks 3,0 m",
          "Avstand til nabogrense må være minst 1,0 m",
          "Bygget kan ikke brukes til beboelse",
          "Du må sende melding til kommunen når bygget er ferdig",
        ],
        nextSteps: [
          "Les vilkårene for unntak nøye før du bygger",
          "Sjekk at tomten ikke har begrensninger i reguleringsplanen",
          "Send melding til kommunen innen 4 uker etter ferdigstillelse",
        ],
        sources: [
          {
            title: "SAK10 § 4-1 Tiltak som ikke krever søknad",
            url: "https://lovdata.no/dokument/SF/forskrift/2010-03-26-488/KAPITTEL_4#%C2%A74-1",
          },
          {
            title: "Oslo kommune - Bygge uten å søke",
            url: "https://www.oslo.kommune.no/plan-bygg-og-eiendom/bygge-uten-a-soke/",
          },
        ],
      }
    }

    // Check for "selv" (can apply yourself)
    if (
      areal <= 70 &&
      hoyde <= 4 &&
      spesielleHensyn !== "ja" &&
      vannAvlop !== "ja"
    ) {
      return {
        status: "selv",
        title: "Du kan søke selv",
        description:
          "Du trenger byggesøknad, men du kan sende søknaden selv uten å bruke fagfolk (ansvarlig søker).",
        conditions: [
          "Bygget må være en enkel konstruksjon",
          "Det må ikke være spesielle hensyn på tomten",
          "Du må dokumentere at tiltaket oppfyller tekniske krav",
          "Nabovarsling må gjennomføres før søknad sendes",
        ],
        nextSteps: [
          "Last ned og fyll ut søknadsskjema fra kommunen",
          "Send nabovarsel og vent minst 2 uker på eventuelle merknader",
          "Legg ved tegninger av bygget (plan, snitt, fasade)",
          "Send søknad til kommunen og betal gebyr",
        ],
        sources: [
          {
            title: "SAK10 § 3-1 Søknad uten ansvarsrett",
            url: "https://lovdata.no/dokument/SF/forskrift/2010-03-26-488/KAPITTEL_3#%C2%A73-1",
          },
          {
            title: "Oslo kommune - Søke om å bygge",
            url: "https://www.oslo.kommune.no/plan-bygg-og-eiendom/soke-om-a-bygge/",
          },
        ],
      }
    }

    // Requires professional help
    return {
      status: "ansvarlig",
      title: "Du trenger fagfolk",
      description:
        "Dette tiltaket krever at du engasjerer en ansvarlig søker (for eksempel arkitekt eller byggmester) som sender søknaden på dine vegne.",
      conditions: [
        "Tiltaket krever profesjonell prosjektering",
        "En kvalifisert fagperson må stå ansvarlig for søknaden",
        "Det kan kreves uavhengig kontroll av deler av arbeidet",
      ],
      nextSteps: [
        "Kontakt en ansvarlig søker (arkitekt, byggmester e.l.)",
        "Få pristilbud fra flere aktører",
        "Ansvarlig søker vil håndtere nabovarsling og søknadsprosessen",
      ],
      sources: [
        {
          title: "SAK10 § 5-1 Ansvarlig søker",
          url: "https://lovdata.no/dokument/SF/forskrift/2010-03-26-488/KAPITTEL_5#%C2%A75-1",
        },
        {
          title: "Oslo kommune - Engasjere fagfolk",
          url: "https://www.oslo.kommune.no/plan-bygg-og-eiendom/soke-om-a-bygge/",
        },
      ],
    }
  }

  // Window/Facade flow logic
  if (flow === "vindu" || flow === "fasadeendring") {
    const endringstype = answers.v1
    const fredet = answers.v2
    const spesielleKrav = answers.v3
    const vesentligEndring = answers.v4
    const baerende = answers.v5

    // Exempt from permit
    if (
      endringstype === "bytte-samme" &&
      fredet !== "ja" &&
      spesielleKrav !== "ja"
    ) {
      return {
        status: "unntak",
        title: "Du trenger trolig ikke å søke",
        description:
          "Å bytte vindu eller dør med samme størrelse og utseende krever normalt ikke søknad.",
        conditions: [
          "Vindu/dør må ha samme størrelse som eksisterende",
          "Utseende må være tilnærmet likt (farge, materiale, inndeling)",
          "Bygget må ikke være vernet eller fredet",
          "Det må ikke være spesielle krav i reguleringsplanen",
        ],
        nextSteps: [
          "Sjekk at det nye vinduet/døren oppfyller tekniske krav",
          "Vurder om endringen påvirker byggets energimerke",
          "Ved tvil, kontakt kommunen for avklaring",
        ],
        sources: [
          {
            title: "SAK10 § 4-1 Tiltak som ikke krever søknad",
            url: "https://lovdata.no/dokument/SF/forskrift/2010-03-26-488/KAPITTEL_4#%C2%A74-1",
          },
        ],
      }
    }

    // Can apply yourself
    if (
      fredet !== "ja" &&
      baerende !== "ja" &&
      (endringstype === "bytte-storre" || vesentligEndring !== "ja")
    ) {
      return {
        status: "selv",
        title: "Du kan søke selv",
        description:
          "Endringen krever søknad, men du kan søke selv uten bruk av ansvarlig søker.",
        conditions: [
          "Endringen må ikke berøre bærende konstruksjoner",
          "Bygget må ikke være fredet",
          "Du må dokumentere at tiltaket oppfyller tekniske krav",
        ],
        nextSteps: [
          "Send nabovarsel til berørte naboer",
          "Lag tegninger som viser endringen",
          "Fyll ut og send søknadsskjema",
        ],
        sources: [
          {
            title: "SAK10 § 3-1 Søknad uten ansvarsrett",
            url: "https://lovdata.no/dokument/SF/forskrift/2010-03-26-488/KAPITTEL_3#%C2%A73-1",
          },
        ],
      }
    }

    // Requires professional
    return {
      status: "ansvarlig",
      title: "Du trenger fagfolk",
      description:
        "Denne endringen krever at du engasjerer ansvarlig søker og eventuelt andre fagfolk.",
      conditions: [
        fredet === "ja" ? "Bygget er vernet/fredet og krever spesiell behandling" : null,
        baerende === "ja" ? "Arbeidet berører bærende konstruksjoner" : null,
        "Det kreves profesjonell prosjektering og dokumentasjon",
      ].filter(Boolean) as string[],
      nextSteps: [
        fredet === "ja"
          ? "Kontakt Byantikvaren for veiledning"
          : "Kontakt en ansvarlig søker",
        "Få gjort en vurdering av omfanget",
        "Ansvarlig søker håndterer søknadsprosessen",
      ],
      sources: [
        {
          title: "SAK10 § 5-1 Ansvarlig søker",
          url: "https://lovdata.no/dokument/SF/forskrift/2010-03-26-488/KAPITTEL_5#%C2%A75-1",
        },
      ],
    }
  }

  const prototypeFlows = new Set([
    "tilbygg",
    "paabygg",
    "terrasse",
    "bod",
    "takendring",
    "stottemur",
    "bruksendring",
    "riving",
  ])

  if (prototypeFlows.has(flow)) {
    return {
      status: "ansvarlig",
      title: "Prototyp-svar for valgt prosjekttype",
      description:
        "Dette er en prototyp med standardvurdering. Det trengs ofte nærmere vurdering basert på lokale regler og detaljer i tiltaket.",
      conditions: [
        "Oppgi detaljer om areal, høyde og plassering når du tar kontakt",
        "Sjekk reguleringsplan og eventuelle hensyn på tomten",
      ],
      nextSteps: [
        "Kontakt kommunen for en konkret vurdering",
        "Forbered en enkel skisse og beskrivelse av tiltaket",
      ],
      sources: [],
    }
  }

  // Default fallback
  return {
    status: "ansvarlig",
    title: "Kontakt kommunen",
    description:
      "Vi kunne ikke gi et klart svar basert på informasjonen. Ta kontakt med kommunen for veiledning.",
    conditions: [],
    nextSteps: ["Kontakt plan- og bygningsetaten i din kommune"],
    sources: [],
  }
}

const statusConfig = {
  unntak: {
    icon: CheckCircle2,
    colorClass: "text-success",
    bgClass: "bg-success/10",
    borderClass: "border-success/30",
    label: "Kan bygge uten søknad",
  },
  selv: {
    icon: AlertTriangle,
    colorClass: "text-warning-foreground",
    bgClass: "bg-warning/20",
    borderClass: "border-warning/40",
    label: "Søknad uten ansvarlig søker",
  },
  ansvarlig: {
    icon: XCircle,
    colorClass: "text-destructive",
    bgClass: "bg-destructive/10",
    borderClass: "border-destructive/30",
    label: "Søknad med ansvarlig søker",
  },
}

function ResultatContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const flow = searchParams.get("flow") || ""
  const answersParam = searchParams.get("answers")
  const [propertyPlans, setPropertyPlans] = useState<
    { title?: string; id?: string }[]
  >([])

  useEffect(() => {
    const storedPlans = sessionStorage.getItem("propertyPlans")
    if (!storedPlans) return

    try {
      const parsed = JSON.parse(storedPlans)
      if (Array.isArray(parsed)) {
        setPropertyPlans(parsed)
      }
    } catch (error) {
      console.error("Kunne ikke lese eiendomsplaner:", error)
    }
  }, [])

  const answers = answersParam ? JSON.parse(answersParam) : {}
  const result = calculateResult(flow, answers)
  const config = statusConfig[result.status]
  const StatusIcon = config.icon

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
            Ny veiledning
          </Button>
          <h1 className="text-xl font-semibold text-foreground">Resultat</h1>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 space-y-6">
        {propertyPlans.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium">
                Planer for eiendommen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {propertyPlans.map((plan, index) => (
                  <li key={`${plan.id ?? plan.title ?? "plan"}-${index}`}>
                    {plan.title ?? "Ukjent plan"}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
        {/* Status Badge */}
        <Card className={cn("border-2", config.borderClass)}>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div
                className={cn(
                  "flex h-12 w-12 shrink-0 items-center justify-center rounded-full",
                  config.bgClass
                )}
              >
                <StatusIcon className={cn("h-6 w-6", config.colorClass)} />
              </div>
              <div className="space-y-2">
                <span
                  className={cn(
                    "inline-block text-xs font-medium uppercase tracking-wide px-2 py-1 rounded",
                    config.bgClass,
                    config.colorClass
                  )}
                >
                  {config.label}
                </span>
                <h2 className="text-xl font-semibold text-foreground text-balance">
                  {result.title}
                </h2>
                <p className="text-muted-foreground">{result.description}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conditions */}
        {result.conditions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Vilkår og forutsetninger
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {result.conditions.map((condition, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3 text-sm text-foreground"
                  >
                    <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                    {condition}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Next Steps */}
        {result.nextSteps.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium">
                Neste steg
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3">
                {result.nextSteps.map((step, index) => (
                  <li key={index} className="flex items-start gap-3 text-sm">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
                      {index + 1}
                    </span>
                    <span className="pt-0.5 text-foreground">{step}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        )}

        {/* Sources */}
        {result.sources.length > 0 && (
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="sources" className="border rounded-lg px-4">
              <AccordionTrigger className="text-sm font-medium hover:no-underline">
                Kilder og lovhenvisninger
              </AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-2 pb-2">
                  {result.sources.map((source, index) => (
                    <li key={index}>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        {source.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}

        {/* Disclaimer */}
        <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
          <p>
            <strong>Merk:</strong> Denne veilederen gir kun veiledende
            informasjon. Kommunen er ikke ansvarlig for beslutninger basert på
            disse svarene. Ved tvil, kontakt plan- og bygningsetaten.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button
            onClick={() => router.push("/")}
            variant="outline"
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Start ny veiledning
          </Button>
          <Button
            onClick={() => window.print()}
            variant="secondary"
            className="gap-2"
          >
            <FileText className="h-4 w-4" />
            Skriv ut / lagre
          </Button>
        </div>
      </main>
    </div>
  )
}

function Loading() {
  return null;
}

export default function ResultatPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ResultatContent />
    </Suspense>
  )
}
