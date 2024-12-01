from typing import List
from typing_extensions import TypedDict
from langgraph.graph import MessagesState


class ReWOO(MessagesState):
    # source_chain_id: int
    # source_token_address: str
    # destination_chain_id: int
    # destination_token_address: str
    # input_amount: str
    task_ready: bool
    task: str
    plan_string: str
    steps: List
    results: dict
    result: str
    should_end : bool
    thread_id: str
    state_variables: list[str]
    chain_finished: bool
    