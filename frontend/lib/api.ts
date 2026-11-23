export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export type AgentMessage = {
  agent: string;
  response: string;
};

export type Metrics = {
  total_sales: number;
  total_expenses: number;
  total_profit: number;
  profit_margin_pct: number;
  best_month: string;
  best_month_profit: number;
  lowest_month: string;
  lowest_month_profit: number;
  first_month_sales: number;
  last_month_sales: number;
  avg_monthly_sales_growth: number;
};

export type MonthlyRow = {
  month: string;
  sales: number;
  expenses: number;
  profit: number;
  margin: number;
};

export type AnalysisResult = {
  status: "success" | "error";
  message: string;
  agents: AgentMessage[];
  pdf: string;
  metrics?: Metrics;
  monthly?: MonthlyRow[];
};

/** Reads the API's safe `detail` message (429, 502, 503, 504 ...). */
async function serverMessage(res: Response, fallback: string) {
  try {
    const body = await res.json();
    if (typeof body?.detail === "string") return body.detail;
  } catch {
    /* body was not JSON */
  }
  return fallback;
}

/** Full URL of a report returned by the API (e.g. "/reports/x.pdf"). */
export function reportUrl(pdf: string) {
  return `${API_URL}${pdf}`;
}

export async function analyzeBusiness(
  company: string,
  objective: string
): Promise<AnalysisResult> {
  let response: Response;

  try {
    response = await fetch(`${API_URL}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ company_name: company, objective }),
      signal: AbortSignal.timeout(180_000), // agents can take a while
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "TimeoutError") {
      throw new Error("The analysis took too long. Please try again.");
    }
    throw new Error(
      `Cannot reach the API at ${API_URL}. If it was idle it may still be waking up (about a minute), otherwise check that the backend is running and allows this site (CORS).`
    );
  }

  if (response.status === 422) {
    throw new Error("Please check the company name and objective.");
  }

  if (!response.ok) {
    throw new Error(
      await serverMessage(
        response,
        `The server returned an error (${response.status}).`
      )
    );
  }

  const data: AnalysisResult = await response.json();

  if (data.status === "error") {
    // data.message holds a server traceback: never show it to users
    throw new Error("The agents could not finish the analysis. Check the backend logs.");
  }

  return data;
}