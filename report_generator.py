from datetime import datetime
from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.styles import getSampleStyleSheet

from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
)

from business_data import compute_metrics


# Folder served by FastAPI at /reports (see app.py)
REPORTS_DIR = Path(__file__).resolve().parent / "reports"


# ReportLab's built-in Helvetica only covers Windows-1252.
# LLMs emit characters outside it (narrow no-break space, non-breaking
# hyphen, minus sign, arrows...) which print as black squares.
_PDF_CHAR_MAP = {
    "\u202f": " ",   # narrow no-break space
    "\u00a0": " ",   # no-break space
    "\u2009": " ",   # thin space
    "\u200a": " ",   # hair space
    "\u2007": " ",   # figure space
    "\u2011": "-",   # non-breaking hyphen
    "\u2010": "-",   # hyphen
    "\u2212": "-",   # minus sign
    "\u2192": "->",  # right arrow
    "\u2190": "<-",  # left arrow
    "\u2248": "~",   # approximately equal
    "\u200b": "",    # zero-width space
}


def to_pdf_safe(text):

    for src, dst in _PDF_CHAR_MAP.items():
        text = text.replace(src, dst)

    # Anything still outside Windows-1252 becomes "?" instead of a black box
    return text.encode("cp1252", errors="replace").decode("cp1252")


def agent_sections(messages):

    """
    Turn AutoGen messages into [(display_name, text)].

    Uses each message's .source and .content instead of str(message),
    which printed UUIDs, token usage and metadata into the report.
    The original task prompt (source 'user') and empty messages are skipped.
    """

    sections = []

    for msg in messages or []:

        source = getattr(msg, "source", "")

        content = getattr(msg, "content", "")

        if source == "user" or not isinstance(content, str):
            continue

        if not content.strip():
            continue

        sections.append(
            (source.replace("_", " ").title(), content)
        )

    return sections


def clean_ai_text(text):

    text = to_pdf_safe(text)

    cleaned_lines = []

    for line in text.split("\n"):

        line = line.strip()

        if not line:
            continue

        # Remove markdown separators
        if line.startswith("---"):
            continue

        # Remove markdown table formatting
        line = line.replace("|", " ")

        # Remove markdown symbols
        line = (
            line
            .replace("###", "")
            .replace("##", "")
            .replace("#", "")
            .replace("***", "")
            .replace("**", "")
            .replace("`", "")
        )

        cleaned_lines.append(line)

    cleaned_text = "\n".join(cleaned_lines)

    # Escape HTML characters for ReportLab
    cleaned_text = escape(cleaned_text)

    # Convert newline to ReportLab line breaks
    cleaned_text = cleaned_text.replace("\n", "<br/>")

    return cleaned_text


def generate_business_report(
    messages,
    df,
    output_path="Business_Intelligence_Report.pdf",
    company_name="Demo Company"
):

    styles = getSampleStyleSheet()

    title_style = styles["Heading1"]
    title_style.alignment = TA_CENTER

    heading_style = styles["Heading2"]

    normal_style = styles["BodyText"]

    doc = SimpleDocTemplate(
        str(output_path)
    )

    story = []

    # ===============================
    # Cover Page
    # ===============================

    story.append(Spacer(1,100))

    story.append(
        Paragraph(
            "Executive Business Performance Report",
            title_style
        )
    )

    story.append(
        Paragraph(
            f"Prepared for {escape(to_pdf_safe(company_name))}",
            normal_style
        )
    )

    story.append(Spacer(1,20))

    story.append(
        Paragraph(
            "Prepared by Business Intelligence Analytics System",
            normal_style
        )
    )

    story.append(
        Paragraph(
            f"Generated: {datetime.now().strftime('%d %B %Y')}",
            normal_style
        )
    )

    story.append(PageBreak())

    # ===============================
    # Executive Summary
    # ===============================

    story.append(
        Paragraph(
            "Executive Summary",
            heading_style
        )
    )

    story.append(
        Paragraph(
            "This report provides structured business analysis "
            "covering performance metrics, profitability, "
            "operational insights, and recommendations.",
            normal_style
        )
    )

    story.append(Spacer(1,20))

    # ===============================
    # KPI Summary
    # ===============================

    metrics = compute_metrics(df)

    total_sales = metrics["total_sales"]

    total_expenses = metrics["total_expenses"]

    total_profit = metrics["total_profit"]

    profit_margin = metrics["profit_margin_pct"]

    best_month = metrics["best_month"]

    kpi_data = [

        ["Metric","Value"],

        ["Total Revenue",f"${total_sales:,.0f}"],

        ["Total Expenses",f"${total_expenses:,.0f}"],

        ["Net Profit",f"${total_profit:,.0f}"],

        ["Profit Margin",f"{profit_margin:.1f}%"],

        ["Best Month",best_month]

    ]

    kpi_table = Table(
        kpi_data,
        colWidths=[220,180]
    )

    kpi_table.setStyle(
        TableStyle([

            (
                "BACKGROUND",
                (0,0),
                (-1,0),
                colors.HexColor("#1F4E78")
            ),

            (
                "TEXTCOLOR",
                (0,0),
                (-1,0),
                colors.white
            ),

            (
                "GRID",
                (0,0),
                (-1,-1),
                1,
                colors.grey
            )

        ])
    )

    story.append(kpi_table)

    story.append(Spacer(1,25))

    # ===============================
    # Monthly Performance
    # ===============================

    story.append(
        Paragraph(
            "Monthly Performance Analysis",
            heading_style
        )
    )

    monthly_data = [

        [
            "Month",
            "Sales",
            "Expenses",
            "Profit",
            "Margin"
        ]

    ]

    for _, row in df.iterrows():

        monthly_data.append(
            [
                row["month"],
                f"${row['sales']:,.0f}",
                f"${row['expenses']:,.0f}",
                f"${row['profit']:,.0f}",
                f"{row['margin']:.1f}%"
            ]
        )

    monthly_table = Table(monthly_data)

    monthly_table.setStyle(
        TableStyle([

            (
                "BACKGROUND",
                (0,0),
                (-1,0),
                colors.HexColor("#2F5597")
            ),

            (
                "TEXTCOLOR",
                (0,0),
                (-1,0),
                colors.white
            ),

            (
                "GRID",
                (0,0),
                (-1,-1),
                1,
                colors.grey
            )

        ])
    )

    story.append(monthly_table)

    story.append(Spacer(1,25))

    # ===============================
    # Agent Analysis
    # ===============================

    story.append(
        Paragraph(
            "Business Intelligence Analysis",
            heading_style
        )
    )

    # One sub-section per agent (task prompt and empty replies skipped)

    sections = agent_sections(messages)

    if not sections:

        story.append(
            Paragraph(
                "No analysis text was returned by the agents.",
                normal_style
            )
        )

    for agent_name, agent_text in sections:

        story.append(
            Paragraph(
                escape(agent_name),
                styles["Heading3"]
            )
        )

        story.append(
            Paragraph(
                clean_ai_text(agent_text),
                normal_style
            )
        )

        story.append(Spacer(1,10))

    story.append(
        Spacer(1,15)
    )

    # ===============================
    # Recommendations
    # ===============================

    story.append(PageBreak())

    story.append(
        Paragraph(
            "Strategic Recommendations",
            heading_style
        )
    )

    recommendation_table = [

        ["Priority","Recommendation"],

        ["High","Optimize operating expenses"],

        ["High","Improve profitability strategy"],

        ["Medium","Strengthen forecasting process"],

        ["Medium","Develop executive dashboard"]

    ]

    rec_table = Table(
        recommendation_table
    )

    rec_table.setStyle(
        TableStyle([

            (
                "BACKGROUND",
                (0,0),
                (-1,0),
                colors.HexColor("#1F4E78")
            ),

            (
                "TEXTCOLOR",
                (0,0),
                (-1,0),
                colors.white
            ),

            (
                "GRID",
                (0,0),
                (-1,-1),
                1,
                colors.grey
            )

        ])
    )

    story.append(rec_table)

    doc.build(story)

    print(
        "Business Intelligence PDF Generated Successfully"
    )