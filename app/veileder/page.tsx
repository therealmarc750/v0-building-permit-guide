"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowLeft, ArrowRight, Home, Layers } from "lucide-react"
import Loading from "./loading"

// Question types
type QuestionType = "yesno" | "number" | "select"

interface Question {
  id: string
  text: string
  helpText?: string
  type: QuestionType
  options?: { value: string; label: string }[]
  unit?: string
  min?: number
  max?: number
}

interface Flow {
  id: string
  title: string
  questions: Question[]
}

// Garage/Carport flow questions
const garasjeFlow: Flow = {
  id: "garasje",
  title: "Garasje eller carport",
  questions: [
    {
      id: "g1",
      text: "Hvor stort areal skal bygget ha?",
      helpText: "Mål utvendig, inkludert vegger",
      type: "number",
      unit: "m²",
      min: 1,
      max: 500,
    },
    {
      id: "g2",
      text: "Skal bygget være frittliggende eller tilbygg?",
      type: "select",
      options: [
        { value: "frittliggende", label: "Frittliggende" },
        { value: "tilbygg", label: "Tilbygg til eksisterende bygg" },
      ],
    },
    {
      id: "g3",
      text: "Hvor høyt blir bygget på det høyeste punktet?",
      helpText: "Mål fra gjennomsnittlig terrengnivå rundt bygget",
      type: "number",
      unit: "meter",
      min: 1,
      max: 20,
    },
    {
      id: "g4",
      text: "Hvor langt fra nabogrensen skal bygget stå?",
      helpText: "Mål til nærmeste yttervegg",
      type: "number",
      unit: "meter",
      min: 0,
      max: 100,
    },
    {
      id: "g5",
      text: "Ligger eiendommen i et regulert område?",
      helpText: "Sjekk reguleringsplan for din eiendom på kommunens nettsider",
      type: "yesno",
    },
    {
      id: "g6",
      text: "Er det spesielle hensyn på tomten?",
      helpText: "F.eks. kulturminner, flom, ras eller strandsone",
      type: "yesno",
    },
    {
      id: "g7",
      text: "Skal bygget ha innlagt vann eller avløp?",
      type: "yesno",
    },
  ],
}

// Window/Facade flow questions
const vinduFlow: Flow = {
  id: "vindu",
  title: "Vindu eller fasadeendring",
  questions: [
    {
      id: "v1",
      text: "Hva slags endring gjelder det?",
      type: "select",
      options: [
        { value: "bytte-samme", label: "Bytte vindu/dør med samme størrelse" },
        { value: "bytte-storre", label: "Bytte til større vindu/dør" },
        { value: "nytt-hull", label: "Lage ny åpning i veggen" },
        { value: "fasade-annet", label: "Annen fasadeendring" },
      ],
    },
    {
      id: "v2",
      text: "Er bygningen fredet eller har vernestatus?",
      helpText: "Sjekk med kommunen eller Riksantikvaren hvis du er usikker",
      type: "yesno",
    },
    {
      id: "v3",
      text: "Ligger bygget i et område med spesielle krav til fasade?",
      helpText: "F.eks. bevaringsområde eller reguleringsplan med krav til utseende",
      type: "yesno",
    },
    {
      id: "v4",
      text: "Endrer du fasadens utseende vesentlig?",
      helpText: "F.eks. ny farge, nye materialer eller endret karakter",
      type: "yesno",
    },
    {
      id: "v5",
      text: "Er veggen en bærende konstruksjon?",
      helpText: "Sjekk byggetegninger eller spør en fagperson ved tvil",
      type: "yesno",
    },
  ],
}

const fasadeFlow: Flow = {
  ...vinduFlow,
  id: "fasadeendring",
  title: "Vindu eller fasadeendring",
}

const createPrototypeFlow = (id: string, title: string): Flow => ({
  id,
  title,
  questions: [
    {
      id: `${id}-area`,
      text: "Hvor stort areal gjelder tiltaket?",
      helpText: "Oppgi omtrentlige kvadratmeter der det er relevant",
      type: "number",
      unit: "m²",
      min: 0,
      max: 1000,
    },
    {
      id: `${id}-height`,
      text: "Hvor høy blir løsningen på det høyeste punktet?",
      type: "number",
      unit: "meter",
      min: 0,
      max: 50,
    },
    {
      id: `${id}-distance`,
      text: "Hvor langt fra nabogrensen skal tiltaket stå?",
      type: "number",
      unit: "meter",
      min: 0,
      max: 100,
    },
    {
      id: `${id}-regulated`,
      text: "Ligger eiendommen i et regulert område?",
      type: "yesno",
    },
    {
      id: `${id}-special`,
      text: "Er det spesielle hensyn på tomten?",
      helpText: "F.eks. kulturminner, flom, ras eller strandsone",
      type: "yesno",
    },
  ],
})

const prototypeFlows: Flow[] = [
  createPrototypeFlow("tilbygg", "Tilbygg"),
  createPrototypeFlow("paabygg", "Påbygg"),
  createPrototypeFlow("terrasse", "Terrasse eller veranda"),
  createPrototypeFlow("bod", "Bod, uthus eller anneks"),
  createPrototypeFlow("takendring", "Takendring"),
  createPrototypeFlow("stottemur", "Støttemur eller gjerde"),
  createPrototypeFlow("bruksendring", "Bruksendring"),
  createPrototypeFlow("riving", "Riving"),
]

const flowCards: { flow: Flow; description: string; icon: typeof Home }[] = [
  {
    flow: garasjeFlow,
    description: "Frittliggende bygg for bil",
    icon: Home,
  },
  {
    flow: fasadeFlow,
    description: "Endring av fasade, vindu eller dør",
    icon: Layers,
  },
  {
    flow: prototypeFlows.find((flow) => flow.id === "tilbygg")!,
    description: "Utvidelse av eksisterende bolig",
    icon: Home,
  },
  {
    flow: prototypeFlows.find((flow) => flow.id === "paabygg")!,
    description: "Ny etasje eller takoppløft",
    icon: Home,
  },
  {
    flow: prototypeFlows.find((flow) => flow.id === "terrasse")!,
    description: "Terrasse, platting eller veranda",
    icon: Home,
  },
  {
    flow: prototypeFlows.find((flow) => flow.id === "bod")!,
    description: "Små frittstående bygg",
    icon: Home,
  },
  {
    flow: prototypeFlows.find((flow) => flow.id === "takendring")!,
    description: "Takvinduer eller endret takform",
    icon: Layers,
  },
  {
    flow: prototypeFlows.find((flow) => flow.id === "stottemur")!,
    description: "Terrengmurer og gjerder",
    icon: Home,
  },
  {
    flow: prototypeFlows.find((flow) => flow.id === "bruksendring")!,
    description: "Kjeller/loft til bolig",
    icon: Layers,
  },
  {
    flow: prototypeFlows.find((flow) => flow.id === "riving")!,
    description: "Rive bygg eller deler av bygg",
    icon: Home,
  },
]

function VeilederContent() {
  const router = useRouter()
  const [flowParam, setFlowParam] = useState<string | null>(null)
  const [selectedFlow, setSelectedFlow] = useState<Flow | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string | number>>({})

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const flow = searchParams.get("flow")
    setFlowParam(flow)
    if (flow === "garasje") {
      setSelectedFlow(garasjeFlow)
    } else if (flow === "vindu" || flow === "fasadeendring") {
      setSelectedFlow(fasadeFlow)
    } else if (flow) {
      const prototypeFlow = prototypeFlows.find((item) => item.id === flow)
      if (prototypeFlow) {
        setSelectedFlow(prototypeFlow)
      }
    }
  }, [])

  const handleFlowSelect = (flow: Flow) => {
    setSelectedFlow(flow)
    setCurrentStep(0)
    setAnswers({})
    router.replace(`/veileder?flow=${flow.id}`)
  }

  const handleAnswer = (questionId: string, value: string | number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  const handleNext = () => {
    if (selectedFlow && currentStep < selectedFlow.questions.length - 1) {
      setCurrentStep((prev) => prev + 1)
    } else if (selectedFlow) {
      // Navigate to results
      const params = new URLSearchParams()
      params.set("flow", selectedFlow.id)
      params.set("answers", JSON.stringify(answers))
      router.push(`/resultat?${params.toString()}`)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
    } else if (selectedFlow) {
      setSelectedFlow(null)
      router.replace("/veileder?flow=velg")
    } else {
      router.push("/")
    }
  }

  const currentQuestion = selectedFlow?.questions[currentStep]
  const hasAnswer = currentQuestion && answers[currentQuestion.id] !== undefined

  // Flow selection screen
  if (!selectedFlow || flowParam === "velg") {
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
              Tilbake
            </Button>
            <h1 className="text-xl font-semibold text-foreground">
              Velg prosjekttype
            </h1>
          </div>
        </header>

        <main className="mx-auto max-w-3xl px-4 py-8">
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Velg hvilken type prosjekt du ønsker veiledning for.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              {flowCards.map(({ flow, description, icon: Icon }) => (
                <Card
                  key={flow.id}
                  className="cursor-pointer transition-colors hover:border-primary/50 hover:bg-muted/50"
                  onClick={() => handleFlowSelect(flow)}
                >
                  <CardContent className="flex items-start gap-4 pt-6">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-medium text-foreground">{flow.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </main>
      </div>
    )
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
              {selectedFlow.title}
            </h1>
            <span className="text-sm text-muted-foreground">
              Spørsmål {currentStep + 1} av {selectedFlow.questions.length}
            </span>
          </div>
          {/* Progress bar */}
          <div className="mt-4 h-1.5 w-full rounded-full bg-muted">
            <div
              className="h-1.5 rounded-full bg-primary transition-all duration-300"
              style={{
                width: `${((currentStep + 1) / selectedFlow.questions.length) * 100}%`,
              }}
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        {currentQuestion && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium text-balance">
                {currentQuestion.text}
              </CardTitle>
              {currentQuestion.helpText && (
                <p className="text-sm text-muted-foreground">
                  {currentQuestion.helpText}
                </p>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Yes/No question */}
              {currentQuestion.type === "yesno" && (
                <RadioGroup
                  value={answers[currentQuestion.id]?.toString() ?? ""}
                  onValueChange={(value) =>
                    handleAnswer(currentQuestion.id, value)
                  }
                  className="flex flex-col gap-3"
                >
                  <Label
                    htmlFor={`${currentQuestion.id}-yes`}
                    className="flex items-center gap-3 rounded-lg border border-border p-4 cursor-pointer hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                  >
                    <RadioGroupItem
                      value="ja"
                      id={`${currentQuestion.id}-yes`}
                    />
                    Ja
                  </Label>
                  <Label
                    htmlFor={`${currentQuestion.id}-no`}
                    className="flex items-center gap-3 rounded-lg border border-border p-4 cursor-pointer hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                  >
                    <RadioGroupItem
                      value="nei"
                      id={`${currentQuestion.id}-no`}
                    />
                    Nei
                  </Label>
                  <Label
                    htmlFor={`${currentQuestion.id}-unknown`}
                    className="flex items-center gap-3 rounded-lg border border-border p-4 cursor-pointer hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                  >
                    <RadioGroupItem
                      value="vet-ikke"
                      id={`${currentQuestion.id}-unknown`}
                    />
                    Vet ikke
                  </Label>
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
                      handleAnswer(
                        currentQuestion.id,
                        e.target.value ? Number(e.target.value) : ""
                      )
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

              {/* Select dropdown */}
              {currentQuestion.type === "select" && currentQuestion.options && (
                <Select
                  value={answers[currentQuestion.id]?.toString() ?? ""}
                  onValueChange={(value) =>
                    handleAnswer(currentQuestion.id, value)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Velg et alternativ" />
                  </SelectTrigger>
                  <SelectContent>
                    {currentQuestion.options.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Navigation */}
              <div className="flex justify-end pt-4">
                <Button
                  onClick={handleNext}
                  disabled={!hasAnswer}
                  className="gap-2"
                >
                  {currentStep < selectedFlow.questions.length - 1 ? (
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
        )}
      </main>
    </div>
  )
}

export default function VeilederPage() {
  return (
    <Suspense fallback={<Loading />}>
      <VeilederContent />
    </Suspense>
  )
}
