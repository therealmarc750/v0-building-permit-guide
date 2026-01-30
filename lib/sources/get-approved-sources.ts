import { createClient } from "@/lib/supabase/server";

export interface ApprovedSource {
  id: string;
  title: string;
  url: string;
  curator_summary: string | null;
}

export async function getApprovedSources(flowName: string): Promise<ApprovedSource[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("sources")
    .select("id, title, url, curator_summary")
    .eq("status", "godkjent")
    .contains("related_flows", [flowName])
    .limit(5);

  if (error) {
    console.error("Error fetching approved sources:", error);
    return [];
  }

  return data || [];
}
