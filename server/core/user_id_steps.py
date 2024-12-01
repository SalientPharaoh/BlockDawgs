# import sys
import os
# sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
# print(os.getcwd())
from state import ReWOO
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage
import uuid
from dotenv import load_dotenv
import os
import json
from termcolor import colored

load_dotenv()


def node(state: ReWOO):
    print(colored(state,"magenta"))
    print("---User ID Step Node---")
    system_message = """
    You are an data extractor. Your task is to extract the hehehSOSUserId from the given message.
    If hehehSOSUserId is present, return it. If not, return an empty string.
    
    Provide your response in the following JSON format and  and do not start the format with ```json```. Just return the normal JSON :
    {
        "user_id": "extracted_hehehSOSUserId_or_empty_string"
    }
    """

    response = ChatOpenAI(model=os.getenv("OPENAI_MODEL")).invoke([
        state["messages"][-1],
        SystemMessage(content=system_message)
    ],temperature=0)

    result = response.content
    print("---User ID result---\n", result)
    user_data = json.loads(result)
    user_id = user_data.get("user_id", "")
    return  {**state, **{"user_id": user_id}}