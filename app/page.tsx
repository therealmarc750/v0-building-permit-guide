"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Info, Home, Layers, ArrowRight, Settings } from "lucide-react"
import Link from "next/link"

const quickStartScenarios = [
  {
    id: "garasje",
    title: "Garasje eller carport",
    description: "Frittliggende bygg for bil",
    icon: Home,
    keywords: ["garasje", "carport"],
  },
  {
    id: "vindu",
    title: "Vindu eller fasadeendring",
    description: "Endring av fasade, vindu eller dør",
    icon: Layers,
    keywords: ["vindu", "fasade", "dør"],
  },
]

export default function StartPage() {
  const router = useRouter()
  const [description, setDescription] = useState("")

  const handleSubmit = () => {
    if (!description.trim()) return

    const lowerDesc = description.toLowerCase()

    // Detect keywords and route to appropriate flow
    if (lowerDesc.includes("garasje") || lowerDesc.includes("carport")) {
      router.push(`/veileder?flow=garasje&desc=${encodeURIComponent(description)}`)
    } else if (
      lowerDesc.includes("vindu") ||
      lowerDesc.includes("fasade") ||
      lowerDesc.includes("kjeller")
    ) {
      router.push(`/veileder?flow=vindu&desc=${encodeURIComponent(description)}`)
    } else {
      // Show type selection
      router.push(`/veileder?flow=velg&desc=${encodeURIComponent(description)}`)
    }
  }

  const handleQuickStart = (flowId: string) => {
    router.push(`/veileder?flow=${flowId}`)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-3xl px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Oslo kommune</p>
              <h1 className="text-xl font-semibold text-foreground">
                Byggesøknad-veileder
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/kildebibliotek">
                <Button variant="ghost" size="sm" className="gap-2">
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">Admin</span>
                </Button>
              </Link>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Info className="h-4 w-4" />
                    <span className="hidden sm:inline">Hva får jeg hjelp med?</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Om denne veilederen</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 text-sm text-muted-foreground">
                    <p>
                      Denne veilederen hjelper deg å finne ut om byggeprosjektet ditt
                      trenger søknad til kommunen.
                    </p>
                    <p>
                      Du vil få spørsmål om prosjektet ditt, og basert på svarene får
                      du vite om du:
                    </p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Kan bygge uten å søke</li>
                      <li>Må søke, men kan gjøre det selv</li>
                      <li>Må søke med hjelp fra fagfolk</li>
                    </ul>
                    <p className="text-xs">
                      Veilederen gir kun veiledende svar. Ved tvil, kontakt
                      kommunen.
                    </p>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="space-y-8">
          {/* Intro */}
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-foreground text-balance">
              Finn ut om du trenger byggesøknad
            </h2>
            <p className="text-muted-foreground">
              Beskriv hva du ønsker å bygge, eller velg en av de vanlige
              prosjekttypene nedenfor.
            </p>
          </div>

          {/* Description Input */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label
                    htmlFor="description"
                    className="text-sm font-medium text-foreground"
                  >
                    Beskriv prosjektet ditt
                  </label>
                  <Textarea
                    id="description"
                    placeholder="F.eks. «Jeg vil bygge en garasje på 30 kvm i hagen» eller «Jeg vil bytte ut vinduet i stuen med en større glassdør»"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="resize-none"
                  />
                </div>
                <Button
                  onClick={handleSubmit}
                  disabled={!description.trim()}
                  className="w-full sm:w-auto gap-2"
                >
                  Start veiledning
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Start Tiles */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Eller velg prosjekttype
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {quickStartScenarios.map((scenario) => (
                <Card
                  key={scenario.id}
                  className="cursor-pointer transition-colors hover:border-primary/50 hover:bg-muted/50"
                  onClick={() => handleQuickStart(scenario.id)}
                >
                  <CardContent className="flex items-start gap-4 pt-6">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <scenario.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-medium text-foreground">
                        {scenario.title}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {scenario.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-border bg-card">
        <div className="mx-auto max-w-3xl px-4 py-6">
          <p className="text-xs text-muted-foreground">
            Dette er en prototype og gir kun veiledende informasjon. Kommunen er
            ikke ansvarlig for beslutninger basert på denne veilederen.
          </p>
        </div>
      </footer>
    </div>
  )
}
