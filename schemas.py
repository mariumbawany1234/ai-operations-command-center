from typing import Any
from pydantic import BaseModel, Field


class AnalysisRequest(BaseModel):

    company_name: str = Field(
        default="Demo Company",
        min_length=1,
        max_length=80
    )

    objective: str = Field(
        default=(
            "Analyze business performance "
            "and provide strategic insights."
        ),
        min_length=1,
        max_length=600
    )


class AnalysisResponse(BaseModel):

    status: str

    message: str

    agents: list[Any]

    pdf: str

    # Real figures for the dashboard (KPI cards + chart)
    metrics: dict[str, Any] | None = None

    monthly: list[dict[str, Any]] | None = None