export type ResultCategory =
  | "soknadsfritt"
  | "soknadspliktig-selv"
  | "soknadspliktig-ansvarlig"
  | "uavklart";

export interface GarasjeAnswers {
  type: "garasje" | "carport";
  area: number | null;
  floors: number;
  basement: "ja" | "nei" | "vet-ikke";
  height: number | null;
  distance: number | null;
  habitation: "ja" | "nei";
  propertyType: "ja" | "nei" | "usikker";
}

export interface RuleResult {
  category: ResultCategory;
  categoryLabel: string;
  categoryDescription: string;
  conditions: string[];
  nextSteps: string[];
}

export function evaluateGarasjeRules(answers: GarasjeAnswers): RuleResult {
  // Rule 1: Missing key fields → Uavklart
  if (answers.area === null || answers.distance === null) {
    return {
      category: "uavklart",
      categoryLabel: "Uavklart",
      categoryDescription: "Vi trenger mer informasjon for å gi deg et svar.",
      conditions: [
        "Du har ikke oppgitt alle nødvendige opplysninger",
        "Areal og avstand til nabogrense er påkrevd",
      ],
      nextSteps: [
        "Gå tilbake og fyll ut manglende felt",
        "Kontakt kommunen hvis du er usikker på målene",
      ],
    };
  }

  // Rule 2: Used for habitation → Søknadspliktig med ansvarlig søker
  if (answers.habitation === "ja") {
    return {
      category: "soknadspliktig-ansvarlig",
      categoryLabel: "Søknadspliktig – krever ansvarlig søker",
      categoryDescription:
        "Bygget krever full byggesøknad med ansvarlig søker fordi det skal brukes til beboelse.",
      conditions: [
        "Bygninger til beboelse krever alltid full byggesøknad",
        "Du må engasjere kvalifisert foretak som ansvarlig søker",
        "Prosjektering og utførelse må gjøres av godkjente foretak",
      ],
      nextSteps: [
        "Kontakt et arkitektkontor eller rådgivende ingeniør",
        "Be om tilbud på komplett byggesøknad",
        "Forbered situasjonsplan og tegninger",
      ],
    };
  }

  // Rule 3: Multiple floors or basement → Søknadspliktig med ansvarlig søker
  if (answers.floors >= 2 || answers.basement === "ja") {
    return {
      category: "soknadspliktig-ansvarlig",
      categoryLabel: "Søknadspliktig – krever ansvarlig søker",
      categoryDescription:
        "Bygget krever full byggesøknad med ansvarlig søker på grunn av størrelse/kompleksitet.",
      conditions: [
        "Bygninger med flere etasjer eller kjeller krever ansvarlig søker",
        "Konstruksjonen må prosjekteres av kvalifisert foretak",
        "Det stilles krav til dokumentasjon og kontroll",
      ],
      nextSteps: [
        "Kontakt et arkitektkontor eller byggmester",
        "Få utarbeidet komplett søknad med tegninger",
        "Sørg for at foretak påtar seg ansvarsrett",
      ],
    };
  }

  // Rule 4: Small building meeting all criteria → Søknadsfritt
  if (
    answers.area <= 50 &&
    answers.distance >= 1 &&
    answers.floors === 1 &&
    answers.basement === "nei"
  ) {
    return {
      category: "soknadsfritt",
      categoryLabel: "Søknadsfritt (men må følge regler)",
      categoryDescription:
        "Basert på dine svar ser det ut til at tiltaket kan være søknadsfritt. Du må likevel følge gjeldende regler.",
      conditions: [
        "Maks 50 m² bruksareal/bebygd areal",
        "Minst 1 meter til nabogrense (eller avtale/dispensasjon)",
        "Kun én etasje og uten kjeller",
        "Må ikke være i strid med planbestemmelser",
        "Maks mønehøyde 4 meter og gesimshøyde 3 meter",
        "Bygget kan ikke brukes til beboelse",
      ],
      nextSteps: [
        "Sjekk reguleringsplanen for din eiendom",
        "Meld fra til kommunen når bygget er ferdig",
        "Ta bilder og oppbevar dokumentasjon",
        "Kontakt kommunen hvis du er i tvil",
      ],
    };
  }

  // Rule 5: Default → Søknadspliktig, kan søke selv
  return {
    category: "soknadspliktig-selv",
    categoryLabel: "Søknadspliktig – du kan søke selv",
    categoryDescription:
      "Tiltaket krever byggesøknad, men du kan søke selv uten ansvarlig søker.",
    conditions: [
      "Sjekk planstatus og byggegrenser for eiendommen",
      "Nabovarsel kan være nødvendig",
      "Dokumentasjon og tegninger må vedlegges søknaden",
      "Tiltaket må ikke være i strid med reguleringsplan",
    ],
    nextSteps: [
      "Last ned søknadsskjema fra kommunens nettsider",
      "Utarbeid situasjonsplan, fasadetegninger og snitt",
      "Send nabovarsel og vent på eventuelle merknader",
      "Send inn komplett søknad til kommunen",
    ],
  };
}
