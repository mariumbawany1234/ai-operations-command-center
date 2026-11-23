import asyncio
import traceback
import uuid

from agents import build_team
from business_data import df, compute_metrics
from guards import env_int
from report_generator import generate_business_report, REPORTS_DIR


class AnalysisError(Exception):

    """The analysis failed. Messages are safe to show to users."""


class AnalysisTimeout(AnalysisError):

    """The agents took longer than ANALYSIS_TIMEOUT_SECONDS."""


ANALYSIS_TIMEOUT = env_int("ANALYSIS_TIMEOUT_SECONDS", 120)

KEEP_REPORTS = 20


def prune_reports(keep=KEEP_REPORTS):

    """Delete the oldest PDFs so the reports folder cannot grow forever."""

    try:

        files = sorted(
            REPORTS_DIR.glob("Business_Intelligence_Report_*.pdf"),
            key=lambda p: p.stat().st_mtime,
            reverse=True
        )

        for old in files[keep:]:
            old.unlink(missing_ok=True)

    except OSError:
        pass  # cleanup must never fail an analysis


# ==========================================
# Business Analysis Service
# ==========================================

async def run_business_analysis(
    company_name="Demo Company",
    objective=(
        "Analyze business performance "
        "and provide strategic insights."
    )
):

    task = f"""
Analyze the business performance of {company_name}.

Business Objective:

{objective}

Generate a concise executive business report.
"""

    try:

        # Fresh team per request: no shared state
        team = build_team()

        result = await asyncio.wait_for(
            team.run(task=task),
            timeout=ANALYSIS_TIMEOUT
        )

        messages = result.messages

        # Unique PDF inside the served reports folder
        REPORTS_DIR.mkdir(exist_ok=True)

        pdf_name = (
            f"Business_Intelligence_Report_{uuid.uuid4().hex[:12]}.pdf"
        )

        # ReportLab is synchronous: keep it off the event loop
        await asyncio.to_thread(
            generate_business_report,
            messages,
            df,
            REPORTS_DIR / pdf_name,
            company_name
        )

        prune_reports()

        # Format Agent Responses
        agent_results = []

        for message in messages:

            # Skip the task prompt (source "user") and empty replies
            if (
                getattr(message, "content", None)
                and message.source != "user"
            ):

                agent_results.append(
                    {
                        "agent": message.source,
                        "response": message.content
                    }
                )

        return {

            "status": "success",
            "message": "Business analysis completed successfully.",

            "agents": agent_results,

            "pdf": f"/reports/{pdf_name}",

            # Real numbers for the dashboard
            "metrics": compute_metrics(df),

            "monthly": df.round(1).to_dict("records")

        }

    except asyncio.TimeoutError as exc:

        print(traceback.format_exc())

        raise AnalysisTimeout(
            "The agents took too long to respond."
        ) from exc

    except Exception as exc:

        # Full details go to the server log, never to the client
        print(traceback.format_exc())

        raise AnalysisError(
            "The agents could not complete the analysis."
        ) from exc