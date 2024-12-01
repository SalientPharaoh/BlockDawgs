from langgraph.graph import END, StateGraph, START
from .state import ReWOO
from .init_node import node as init_node
from dotenv import load_dotenv
import uuid
import time
from .tool_execution_node import tool_execution
from .planning_node import get_plan
from .utils.checkpointer import checkpointer
from .chat_node import node as chat_node
from langgraph.checkpoint.memory import MemorySaver
from termcolor import colored
from langchain_core.messages import BaseMessage, HumanMessage, ToolMessage, AIMessage


def ending_node(state: ReWOO):
    print(colored("---Ending Node---", "light_blue"))
    state['task'] = None
    state['steps'] = None
    state['results'] = None
    state['result'] = None
    state['plan_string'] =  None
    return {**state, **{"chain_finished": True}}

def _get_current_task(state: ReWOO):
    if "results" not in state or state["results"] is None:
        return 1
    if len(state["results"]) == len(state["steps"]):
        return None
    else:
        return len(state["results"]) + 1

def _route(state):
    _step = _get_current_task(state)
    if _step is None:
        return "ending_node"
        # return "solver"
    else:
        # We are still executing tasks, loop back to the "tool" node
        return "tool"

# Add nodes
graph = StateGraph(ReWOO)
graph.add_node("init_node", init_node)
# graph.add_node("user_id_node", user_id_node )
graph.add_node("chat", chat_node)
graph.add_node("plan", get_plan)
graph.add_node("tool", tool_execution)
graph.add_node("ending_node", ending_node)



# Add edges
graph.add_edge(START, "init_node")
# graph.add_edge("init_node")

graph.add_edge("init_node", "chat")
graph.add_conditional_edges(
    "chat",
    lambda x: {
        False: END,
        True: ["plan"]
    }[x["task_ready"]]
)
graph.add_edge("plan", "tool")
graph.add_conditional_edges("tool", _route)
graph.add_edge("ending_node", END)

# checkpointer = MemorySaver()


graph_runner = graph.compile(checkpointer=checkpointer)

async def run_agent(query,thread_id_provider,sender_address=None):
     # memory = MemorySaver()
    config = {
            "configurable": {
            "thread_id": thread_id_provider
        }
    }

    formatted_query = query
    message_history = []
    message_history.append(HumanMessage(content=formatted_query))
    try:
            initial_state = ReWOO(messages=message_history , thread_id=thread_id_provider)
          
            for event in graph_runner.stream(initial_state, config=config):
                if isinstance(event, dict):
                    print(colored(event, "cyan"))
                    for node_name, node_value in event.items():
                        if node_name == "chat":
                             if isinstance(node_value, dict):
                                messages = node_value['messages']
                                # for message in messages:
                                if isinstance(messages[-1], AIMessage):
                                        print(colored(messages[-1].content, "red"))
                                        yield (messages[-1])
                        elif node_name == "plan":
                            # task, plan_string , steps 
                            if isinstance(node_value, dict):
                                if "task" in node_value:
                                    task = node_value["task"]
                                    
                                if "plan_string" in node_value:
                                    plan_string = node_value["plan_string"]
                                    plans = plan_string.split("\n")
                                if "steps" in node_value:
                                    steps = node_value["steps"]
                                content = f"**Task Detected**: \n{task} \n\n **Actions Planned**:\n {plan_string}"
                                message = AIMessage(content=content , name="tool") 
                                yield(message)

    finally:
            print("Graph Execution Completed")

if __name__ == "__main__":
    import asyncio
    
    async def main():
        query = "Enter first query or type quit to exit"
        while(query!="quit"):
#         # Example message
#         # query = """ I want to swap 2 USDT to USDC on ethereum """
#     #     query = """
#     # "sourceChainId": 1,
#     # "sourceTokenAddress": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
#     # "destinationChainId": 1,
#     # "destinationTokenAddress": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
#     # "inputAmount": "20000000"
#     # """
#             # query = "CONFIRM"
            query = input("Enter query or type quit to exit: ")
#             # query = "I want to swap 2 USDT to USDC on ethereum"
            thread_id = "thread_19"  # Example thread ID
#             sender_address = "0x1234567890123456789012345678901234567890"
#             # Run the agent
            result = await run_agent(query, thread_id)
        
    # Run the async main function   
    asyncio.run(main())