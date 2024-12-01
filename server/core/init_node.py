from langchain.schema import HumanMessage
from .state import ReWOO
from termcolor import colored
import uuid

def node(state):
    print(colored("---State Init Node---", "light_blue"))
    print(colored(state , "red"))
    return  {**state, **{"task_ready": False}}