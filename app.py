import asyncio
import os

from dotenv import load_dotenv

# Load .env before reading any settings below
load_dotenv()

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware

from fastapi.staticfiles import StaticFiles

from guards import DailyCap, RateLimiter, client_ip, env_int

from report_generator import REPORTS_DIR

from schemas import (
    AnalysisRequest,
    AnalysisResponse
)

from services import (
    AnalysisError,
    AnalysisTimeout,
    run_business_analysis
)


# ==========================================
# Settings (all overridable with env vars)
# ==========================================

ALLOWED_ORIGINS = [
    o.strip()
    for o in os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000"
    ).split(",")
    if o.strip()
]

# Optional: also allow Vercel preview deployments of YOUR project, e.g.
# ALLOWED_ORIGIN_REGEX=https://ai-operations-command-center-.*\.vercel\.app
ALLOWED_ORIGIN_REGEX = os.getenv("ALLOWED_ORIGIN_REGEX") or None

RATE_LIMIT_PER_HOUR = env_int("RATE_LIMIT_PER_HOUR", 5)

DAILY_LIMIT = env_int("DAILY_LIMIT", 100)

MAX_CONCURRENT = env_int("MAX_CONCURRENT", 1)


# ==========================================
# Abuse protection
# ==========================================

rate_limiter = RateLimiter(RATE_LIMIT_PER_HOUR, 3600)

daily_cap = DailyCap(DAILY_LIMIT)

slots = asyncio.Semaphore(MAX_CONCURRENT)


# ==========================================
# FastAPI Application
# ==========================================

app = FastAPI(

    title="AI Operations Command Center",

    description="Multi-Agent Business Intelligence Platform",

    version="1.0"

)

# ==========================================
# PDF Reports Directory
# ==========================================

# Absolute path (not dependent on the working directory); create if missing
REPORTS_DIR.mkdir(exist_ok=True)

app.mount(
    "/reports",
    StaticFiles(directory=REPORTS_DIR),
    name="reports"
)


# ==========================================
# CORS
# ==========================================

app.add_middleware(

    CORSMiddleware,

    allow_origins=ALLOWED_ORIGINS,

    allow_origin_regex=ALLOWED_ORIGIN_REGEX,

    # No cookies or auth headers are used
    allow_credentials=False,

    allow_methods=["GET", "POST", "OPTIONS"],

    allow_headers=["Content-Type"],

)


# ==========================================
# Health Checks
# ==========================================

@app.get("/")

def home():

    return {

        "status": "AI Operations Command Center API Running"

    }


@app.get("/health")

def health():

    return {"status": "ok"}


# ==========================================
# Analyze Endpoint
# ==========================================

@app.post(
    "/analyze",
    response_model=AnalysisResponse
)

async def analyze(

    request: AnalysisRequest,

    http_request: Request

):

    ip = client_ip(
        http_request.headers.get("x-forwarded-for"),
        http_request.client.host if http_request.client else None
    )

    # 1. Busy check first, so a rejected request does not use up the quota
    if slots.locked():

        raise HTTPException(
            status_code=503,
            detail=(
                "The analyst team is busy with another request. "
                "Please try again in a minute."
            ),
            headers={"Retry-After": "30"}
        )

    # 2. Per-IP hourly limit
    allowed, retry_after = rate_limiter.check(ip)

    if not allowed:

        raise HTTPException(
            status_code=429,
            detail=(
                f"Rate limit reached ({RATE_LIMIT_PER_HOUR} analyses "
                "per hour). Please try again later."
            ),
            headers={"Retry-After": str(retry_after)}
        )

    # 3. Global daily budget (cannot be bypassed by spoofing headers)
    if not daily_cap.try_consume():

        raise HTTPException(
            status_code=429,
            detail=(
                "The daily demo limit has been reached. "
                "Please try again tomorrow."
            ),
            headers={"Retry-After": "3600"}
        )

    async with slots:

        try:

            return await run_business_analysis(
                request.company_name,
                request.objective
            )

        except AnalysisTimeout:

            raise HTTPException(
                status_code=504,
                detail=(
                    "The analysis took too long. "
                    "Please try again."
                )
            )

        except AnalysisError:

            raise HTTPException(
                status_code=502,
                detail=(
                    "The AI agents could not complete the analysis. "
                    "Please try again."
                )
            )


# ==========================================
# Run Server
# ==========================================

if __name__ == "__main__":

    import uvicorn

    uvicorn.run(
        "app:app",
        host="127.0.0.1",
        port=8000,
        reload=True
    )