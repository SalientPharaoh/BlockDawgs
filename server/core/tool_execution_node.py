from .state import ReWOO 
import requests
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
        tool_input = tool_input.upper()
        tool_input_list = [item.strip() for item in tool_input.split(',')]
        if len(tool_input_list) == 7:
            obj = {
                "fromToken": tool_input_list[0],
                "userAddress": tool_input_list[1],
                "toToken": tool_input_list[2],
                "receiverAddress": tool_input_list[3],
                "fromChainName": tool_input_list[4],
                "toChainName": tool_input_list[5],
                "inputAmount": tool_input_list[6]
            }
        
            response = requests.post('https://e23c-36-255-87-26.ngrok-free.app/api/request-route', json=obj)
            result = response.json()
            print(colored(result, "magenta"))
       
    elif tool == "Optimal_Path_SameChainOther":
        print(colored(tool_input, "red"))
        print(colored("---Optimal_Path_SameChainOther Tool---", "yellow"))
        tool_input = tool_input.upper()
        tool_input_list = [item.strip() for item in tool_input.split(',')]
        if len(tool_input_list) == 7:
            obj = {
                "fromToken": tool_input_list[0],
                "userAddress": tool_input_list[1],
                "toToken": tool_input_list[2],
                "receiverAddress": tool_input_list[3],
                "fromChainName": tool_input_list[4],
                "toChainName": tool_input_list[5],
                "inputAmount": tool_input_list[6]
            }
        
            print(type(tool_input))
            response = requests.post('https://e23c-36-255-87-26.ngrok-free.app/api/request-route', json=obj)
            result = response.json()
            print(colored(result, "magenta"))


    elif tool == "Optimal_Path_SameChainSelf":
        print(colored(tool_input, "red"))
        tool_input = tool_input.upper()
        tool_input_list = [item.strip() for item in tool_input.split(',')]
        if len(tool_input_list) == 7:
            obj = {
                "fromToken": tool_input_list[0],
                "userAddress": tool_input_list[1],
                "toToken": tool_input_list[2],
                "receiverAddress": tool_input_list[3],
                "fromChainName": tool_input_list[4],
                "toChainName": tool_input_list[5],
                "inputAmount": tool_input_list[6]
            }
        
            print(type(tool_input))
            response = requests.post('https://e23c-36-255-87-26.ngrok-free.app/api/request-route', json=obj)
            result = response.json()
            print(colored(result, "magenta"))


    else:
        raise ValueError("Tool not found")
    _results[step_name] = str(result)
    state["results"] = _results
    return {**state, **{"has_optimal_path": True , "optimal_path": result}}  