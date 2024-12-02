from termcolor import colored
from .wrappers.chat_wrapper import chat_subgraph_wrapper
import uuid
def node(state):
    print(colored("---Chat Node---", "light_blue"))
    updated_state = chat_subgraph_wrapper(state=state)
    if "inner_messages" in updated_state:
        state['messages'] = updated_state['inner_messages']
        print(colored(state['messages'][-1].content,"yellow"))
    if "task_ready" in updated_state:
        state['task'] = updated_state['task']
        print(colored(state['task'],"yellow"))
        state['task_ready'] = True
    if "should_execute" in updated_state and updated_state['should_execute']:
        state['should_execute'] = True
    return state