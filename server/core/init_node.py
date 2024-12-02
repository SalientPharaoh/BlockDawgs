from langchain.schema import HumanMessage
from .state import ReWOO
from termcolor import colored
import uuid

def node(state):
    print(colored("---State Init Node---", "light_blue"))
    print(colored(state , "red"))
    if "should_execute" in state and state['should_execute']:
        task_ready = True
        should_execute = True
    else:
        task_ready = False
        should_execute = False
    
    if "has_optimal_path" in state and state['has_optimal_path']:
        has_optimal_path = True
    else:
        has_optimal_path = False
    
    return  {**state, **{"task_ready": task_ready , "should_execute": should_execute , "has_optimal_path": has_optimal_path}}