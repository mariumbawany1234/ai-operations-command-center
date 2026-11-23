import os

from dotenv import load_dotenv

from autogen_agentchat.agents import AssistantAgent
from autogen_agentchat.conditions import MaxMessageTermination
from autogen_agentchat.teams import RoundRobinGroupChat

from autogen_ext.models.openai import OpenAIChatCompletionClient

from business_data import business_dataset, verified_metrics


# ==========================================
# Environment
# ==========================================

load_dotenv()

api_key = os.getenv("GROQ_API_KEY")

if not api_key:
    raise ValueError("GROQ_API_KEY not found in .env file.")


# ==========================================
# Groq Model Client
# ==========================================

model_client = OpenAIChatCompletionClient(

    model="openai/gpt-oss-20b",

    api_key=api_key,

    base_url="https://api.groq.com/openai/v1",

    # gpt-oss is a reasoning model: reasoning tokens count against this
    # limit. 1000 left the first agent with an empty visible answer.
    max_tokens=4000,

    reasoning_effort="low",

    model_info={

        "vision": False,

        "function_calling": True,

        "json_output": True,

        "structured_output": False,

        "family": "openai",

    },

    include_name_in_messages=True
)


# ==========================================
# Multi-Agent Team (built fresh for every request)
# ==========================================
# AutoGen agents and teams are stateful and cannot run concurrently.
# A shared module-level team leaked history between requests and raised
# "team is already running" on a second call, so we build a new one each time.

def build_team():

    business_manager = AssistantAgent(
        name="business_manager",
        model_client=model_client,
        system_message=f"""
You are a professional Business Manager.

Business Dataset:

{business_dataset}

Verified Metrics (already calculated, do not recalculate):

{verified_metrics}

Define:

- Business objective
- Important KPIs
- Key business questions

Provide a short business plan.

Limit your response to 150 words.
""",
    )

    data_analyst = AssistantAgent(
        name="data_analyst",
        model_client=model_client,
        system_message=f"""
You are a Senior Business Data Analyst.

Business Dataset:

{business_dataset}

Verified Metrics (already calculated and correct):

{verified_metrics}

Do NOT calculate totals yourself. Use the verified metrics exactly as written.
Do NOT invent years, dates or numbers that are not in the dataset.

Provide:

1. Total Sales, Total Expenses and Total Profit (copy from verified metrics)
2. Best and Lowest Performing Month (copy from verified metrics)
3. Describe the Sales Trend
4. Describe the Profit Trend
5. One business recommendation

Return concise bullet points.

Maximum 250 words.
""",
    )

    executive = AssistantAgent(
        name="executive",
        model_client=model_client,
        system_message=f"""
You are the Chief Executive Officer.

Verified Metrics (use only these figures):

{verified_metrics}

Review the business analysis and provide:

- Executive Summary
- Key Findings
- Business Risks
- Strategic Recommendations
- Next Action Items

Keep the response under 150 words.
""",
    )

    return RoundRobinGroupChat(
        participants=[
            business_manager,
            data_analyst,
            executive,
        ],
        # 4 = the task message + one reply from each of the 3 agents.
        # The task itself counts as a message, so 3 stopped the
        # executive from ever speaking.
        termination_condition=MaxMessageTermination(
            max_messages=4
        ),
    )