from functools import lru_cache

from langchain.agents import AgentExecutor, create_tool_calling_agent
from langchain_core.messages import AIMessage, HumanMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_openai import ChatOpenAI

from app.agent.prompts import SYSTEM_PROMPT
from app.agent.tools import AGENT_TOOLS
from app.core.config import settings


@lru_cache(maxsize=1)
def get_agent_executor() -> AgentExecutor:
    llm = ChatOpenAI(
        model=settings.DEEPSEEK_MODEL,
        api_key=settings.DEEPSEEK_API_KEY,
        base_url=settings.DEEPSEEK_BASE_URL,
        temperature=0.2,
    )
    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", SYSTEM_PROMPT),
            MessagesPlaceholder("chat_history"),
            ("human", "{input}"),
            MessagesPlaceholder("agent_scratchpad"),
        ]
    )
    agent = create_tool_calling_agent(llm, AGENT_TOOLS, prompt)
    return AgentExecutor(agent=agent, tools=AGENT_TOOLS, max_iterations=6)


async def run_agent(message: str, history: list[tuple[str, str]]) -> str:
    """Run the agent. history is a list of (role, content) with role 'user' or 'assistant'."""
    chat_history = [
        HumanMessage(content=content) if role == "user" else AIMessage(content=content)
        for role, content in history
    ]
    executor = get_agent_executor()
    result = await executor.ainvoke({"input": message, "chat_history": chat_history})
    return result["output"]
