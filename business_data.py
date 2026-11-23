import pandas as pd


# ==========================================
# Business Dataset
# ==========================================

df = pd.DataFrame({

    "month": [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June"
    ],

    "sales": [
        1000,
        1500,
        2000,
        2500,
        3000,
        3500
    ],

    "expenses": [
        800,
        1200,
        1600,
        2000,
        2400,
        2800
    ]

})


# Calculated Metrics

df["profit"] = df["sales"] - df["expenses"]

df["margin"] = (
    df["profit"] / df["sales"]
) * 100


business_dataset = df.to_string(index=False)


# ==========================================
# Verified Metrics (single source of truth)
# ==========================================
# Numbers are computed here in Python, never by the LLM.
# The agents narrate these values and the PDF reuses them,
# so the report can never contradict itself.

def compute_metrics(frame=df):

    total_sales = float(frame["sales"].sum())

    total_expenses = float(frame["expenses"].sum())

    total_profit = float(frame["profit"].sum())

    best = frame.loc[frame["profit"].idxmax()]

    lowest = frame.loc[frame["profit"].idxmin()]

    periods = len(frame) - 1

    return {

        "total_sales": total_sales,

        "total_expenses": total_expenses,

        "total_profit": total_profit,

        "profit_margin_pct": (total_profit / total_sales) * 100,

        "best_month": str(best["month"]),

        "best_month_profit": float(best["profit"]),

        "lowest_month": str(lowest["month"]),

        "lowest_month_profit": float(lowest["profit"]),

        "first_month_sales": float(frame["sales"].iloc[0]),

        "last_month_sales": float(frame["sales"].iloc[-1]),

        "avg_monthly_sales_growth": (
            float(frame["sales"].iloc[-1] - frame["sales"].iloc[0])
            / periods
        ) if periods > 0 else 0.0,

    }


def format_metrics(metrics=None):

    m = metrics or compute_metrics()

    return (
        f"- Total Sales: ${m['total_sales']:,.0f}\n"
        f"- Total Expenses: ${m['total_expenses']:,.0f}\n"
        f"- Total Profit: ${m['total_profit']:,.0f}\n"
        f"- Overall Profit Margin: {m['profit_margin_pct']:.1f}%\n"
        f"- Best Month (highest profit): {m['best_month']} "
        f"(${m['best_month_profit']:,.0f})\n"
        f"- Lowest Month (lowest profit): {m['lowest_month']} "
        f"(${m['lowest_month_profit']:,.0f})\n"
        f"- Sales grew from ${m['first_month_sales']:,.0f} to "
        f"${m['last_month_sales']:,.0f} "
        f"(about ${m['avg_monthly_sales_growth']:,.0f} per month)"
    )


verified_metrics = format_metrics()