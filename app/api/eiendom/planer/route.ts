import { NextResponse } from "next/server"

type PropertyLookupInput = {
  gnr?: string
  bnr?: string
  address?: string
}

const DEFAULT_PLANREGISTER_URL =
  "https://pb360tjenester.sesam.pbe.oslo.kommune.no:9443/DOK/dok/kartgrunnlag"

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as PropertyLookupInput
    const hasInput = Boolean(body?.gnr || body?.bnr || body?.address)

    if (!hasInput) {
      return NextResponse.json(
        { error: "Oppgi gnr/bnr eller adresse for å hente planer." },
        { status: 400 },
      )
    }

    const apiUrl = process.env.OSLO_PLANREGISTER_API_URL || DEFAULT_PLANREGISTER_URL
    const url = new URL(apiUrl)

    if (body.gnr?.trim()) {
      url.searchParams.set("gnr", body.gnr.trim())
    }

    if (body.bnr?.trim()) {
      url.searchParams.set("bnr", body.bnr.trim())
    }

    if (body.address?.trim()) {
      url.searchParams.set("address", body.address.trim())
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: "Kunne ikke hente planer fra Planregister." },
        { status: 502 },
      )
    }

    const data = await response.json()

    return NextResponse.json({
      plans: data?.plans ?? data,
    })
  } catch (error) {
    console.error("Eiendom plan lookup error:", error)
    return NextResponse.json(
      { error: "Uventet feil ved oppslag av planer." },
      { status: 500 },
    )
  }
}
