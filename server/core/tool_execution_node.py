from .state import ReWOO 
def _get_current_task(state: ReWOO):
    if "results" not in state or state["results"] is None:
        return 1
    if len(state["results"]) == len(state["steps"]):
        return None
    else:
        return len(state["results"]) + 1
import ast
from termcolor import colored
import json

def tool_execution(state: ReWOO):
    """Worker node that executes the tools of a given plan."""
    print(colored("---Tool Execution Node---", "light_blue"))
    _step = _get_current_task(state)
    
    # Check if steps exist and are valid
    if not state.get("steps") or len(state["steps"]) == 0:
        print(colored("No steps available to execute", "yellow"))
        return state
        
    if _step is None or _step <= 0 or _step > len(state["steps"]):
        print(colored(f"Invalid step number: {_step}", "yellow"))
        return state
        
    _, step_name, tool, tool_input = state["steps"][_step - 1]
    _results = (state["results"] or {}) if "results" in state else {}
    for k, v in _results.items():
        tool_input = tool_input.replace(k, v)
    if tool == "Optimal_Path_CrossChain":
        print(colored(tool_input, "red"))
        print(colored("---Optimal_Path_CrossChain Tool---", "yellow"))
        result = "At Optimal_Path_CrossChain node"
       
    elif tool == "Optimal_Path_SameChainOther":
        print(colored(tool_input, "red"))
        print(colored("---Optimal_Path_SameChainOther Tool---", "yellow"))
        result = "At Optimal_Path_SameChainOther node"

    elif tool == "Optimal_Path_SameChainSelf":
        print(colored(tool_input, "red"))
        if len(tool_input) == 7:
            obj = {
                "fromToken": tool_input[0],
                "userAddress": tool_input[1],
                "toToken": tool_input[2],
                "receiverAddress": tool_input[3],
                "fromChainName": tool_input[4],
                "toChainName": tool_input[5],
                "inputAmount": tool_input[6]
            }
        else:
            result = "At Optimal_Path_SameChainSelf node"
        print(colored("---Optimal_Path_SameChainSelf Tool---", "yellow"))
        result = "At Optimal_Path_SameChainSelf node"
    else:
        raise ValueError("Tool not found")
    _results[step_name] = str(result)
    state["results"] = _results
    return state