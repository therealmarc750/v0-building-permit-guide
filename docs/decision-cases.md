# Topp 10 byggesak-cases (prototype)

Denne listen beskriver de 10 vanligste case-typene som ofte blir etterspurt i en byggesøknadsveileder.
Den brukes som prototyp-grunnlag for `guidance_rules` og gir et tydelig startpunkt for hvilke prosjekt-typer
som bør støttes først.

## 1) garasje / carport
- **project_type:** `garasje`
- **Hvorfor:** Svært vanlig tiltak for privatpersoner.
- **Typiske vurderinger:** Areal, avstand til nabogrense, høyde, plassering.

## 2) tilbygg
- **project_type:** `tilbygg`
- **Hvorfor:** Utvidelser av eksisterende bolig er hyppig forespurt.
- **Typiske vurderinger:** Areal, BYA/utnyttelse, avstand, brannkrav.

## 3) påbygg (ny etasje / takoppløft)
- **project_type:** `paabygg`
- **Hvorfor:** Vanlig ved behov for mer plass.
- **Typiske vurderinger:** Høyde, antall etasjer, konstruksjon, estetikk.

## 4) terrasse / veranda
- **project_type:** `terrasse`
- **Hvorfor:** Hyppig tiltak i småhusområder.
- **Typiske vurderinger:** Høyde over terreng, rekkverk, avstand.

## 5) bod / uthus / anneks
- **project_type:** `bod`
- **Hvorfor:** Vanlige frittstående småbygg.
- **Typiske vurderinger:** Areal, plassering, høyde, avstand.

## 6) fasadeendring (vindu/dør)
- **project_type:** `fasadeendring`
- **Hvorfor:** Ofte etterspurt ved oppussing og energi-oppgraderinger.
- **Typiske vurderinger:** Vesentlig utseende, vernekrav, fasadereglene.

## 7) takendring
- **project_type:** `takendring`
- **Hvorfor:** Etterisolering, takvinduer, eller endret form.
- **Typiske vurderinger:** Høyde, volum, estetikk, krav i regulering.

## 8) støttemur / gjerde
- **project_type:** `stottemur`
- **Hvorfor:** Vanlig ved terrengtilpasning.
- **Typiske vurderinger:** Høyde, avstand, terrengendring.

## 9) bruksendring (loft/kjeller til bolig)
- **project_type:** `bruksendring`
- **Hvorfor:** Vanlig for å utnytte eksisterende areal.
- **Typiske vurderinger:** TEK-krav, rømningsvei, takhøyde, lys.

## 10) riving
- **project_type:** `riving`
- **Hvorfor:** Eldre bygg og mindre tiltak før nybygg.
- **Typiske vurderinger:** Fare, miljø, avfallshåndtering.

## Hvordan brukes i prototypen?
- Disse project_type-ene seedes i `guidance_rules` med en trygg standardregel ("avhenger").
- Når mer detaljerte regler legges inn senere, overstyrer de standardregelen via prioritet.
