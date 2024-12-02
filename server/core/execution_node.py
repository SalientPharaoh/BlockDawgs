from .state import ReWOO
from termcolor import colored
def node(state: ReWOO):
    print(colored("---Execution Node---", "light_blue"))
    state['should_execute'] = True
    return {"should_execute": True , "optimal_path": state['optimal_path']}
