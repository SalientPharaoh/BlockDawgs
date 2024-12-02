from langchain_together import ChatTogether
from .state import ReWOO
import os
from dotenv import load_dotenv
from termcolor import colored
from langchain_core.messages import SystemMessage , AIMessage
load_dotenv()
def node(state: ReWOO):
    print(colored("---Optimal Node---", "light_blue"))
    result = state["results"]
    model = ChatTogether(
        api_key = os.getenv("TOGETHER_API_KEY"),
        model="meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo",
        temperature=0,
        max_tokens=None,
        timeout=None,
        max_retries=2,
    )
    prompt = """You are an expert in web3 and blockchain. You are working with the web3 ecosystem here.
    You also have the results from previous tools here.
    You are given with the most optimal method of completing the task.
    Task : {task}
    Result: {result}
    You have to inform the user in a conversational way that you have found the most optimal method to complete the task and just stitch words together the results from the Result.
    Don't write anything new.
    Do not write any details of the plan in the inputs.
    Also ask the user if they want to EXECUTE the plan or not.
    """
    system_prompt = (
        prompt)
    messages = [SystemMessage(content=system_prompt)] + state["messages"]
    response = model.invoke(messages)
    state['optimal_plan'] = response.content
    state['messages'] = state['messages'] + [AIMessage(content=response.content)]
    return state