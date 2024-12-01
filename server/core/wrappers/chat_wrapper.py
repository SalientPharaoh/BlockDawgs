
from langchain_openai import ChatOpenAI
import os
from dotenv import load_dotenv
from termcolor import colored
from langgraph.graph import END, StateGraph, START
from dotenv import load_dotenv
from langgraph.graph import MessagesState
from langgraph.checkpoint.memory import MemorySaver
from langchain_together import ChatTogether

import json
load_dotenv()
model = ChatTogether(
    api_key = os.getenv("TOGETHER_API_KEY"),
    model="google/gemma-2-27b-it",
    temperature=0,
    max_tokens=None,
    timeout=None,
    max_retries=2,
)
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import START, MessagesState, StateGraph
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage

class ChatState(MessagesState):
    should_end: bool
    task_determined: str
    state_variables: list
# Define the function that calls the model
def call_model(state: ChatState):
    context ="""
        (1) Optimal_Path_SameChainSelf[INPUTS]: It is a subgraph which generates optimal paths. It is 
        useful when you need want to determine the most optimal path to complete a transaction on the blockchain when there is a same chain Transaction to self.
        When telling the user about the tool do not tell the exact tool name but a human readable name.

        (2) Optimal_Path_SameChainOther[INPUTS]: It is a subgraph which generates optimal paths. It is 
        useful when you need want to determine the most optimal path to complete a transaction on the blockchain when there is a same chain Transaction to other address.
        When telling the user about the tool do not tell the exact tool name but a human readable name.

        (3) Optimal_Path_CrossChain[INPUTS]: It is a subgraph which generates optimal paths. It is 
        useful when you need want to determine the most optimal path to complete a transaction on the blockchain when there is a cross chain Transaction.
        When telling the user about the tool do not tell the exact tool name but a human readable name.

    
    If any of the universal inputs is missing then ask then user to provide what is missing..
        Here are the rules for the inputs:
        1. You are only allowed to accept 3 tokens right now: USDC, USDT , ETH. If user requests any other token then ask them that we only support USDC, USDT and ETH in a friendly way.
        2. You are only allowed to accept 3 chains right now: Polygon, Base , Avalanche. If user requests any other chain then ask them that we only support Ethereum, Base and Avalanche in a friendly way.

    """
    data_format = """
 {
     fromToken: string
     senderAddress: string
     toToken: string
     receiverAddress: string
     fromChainName: string
     toChainName: string
     inputAmount: string
 }
    """

    sample_final_tasks = """
    "Swap 100 USDC to ETH on Polygon using address 0x1234...5678 as sender and receiver"
    "Transfer 50 USDT from address 0xabcd...efgh on Avalanche to address 0x9876...5432 on Base"
    "Swap 200 ETH to USDC on Base from address 0x2468...1357 and send to address 0x1357...2468"
    "Convert 75 USDT to USDC on Avalanche using address 0xfedc...ba98 as sender and receiver"
    "Send 150 ETH from address 0x1111...2222 on Polygon to address 0x3333...4444 on Base"
    "Swap 500 USDT to ETH on Polygon using address 0x9999...aaaa as senderc and receiver"
    "Transfer 100 ETH from address 0xbbbb...cccc on Base to address 0xdddd...eeee on Avalanche"
    """
    

    important_instructions = """
    1.For any transaction to happen all this is mandatorily required:
    <requirements>
    {data_format}
    </requirements>
    """.format(data_format = data_format)

    prompt = """ 
            You are smart web3 agent which interacts with the user and helps them with web3. \n
            Your users can be of two types:
            - New to web3
            - Familiar with web3
            Depending on this you may have to also help clear the user about the web3 ecosystem.
            You have to formulate a final prompt for an agent next to you so that they can solve the task.
            At the end you have to understand the entire conversation and provide a final task.
            You have access to the variables in the state to help you in your task. 
            <important_instructions>
            {important_instructions}
            </important_instructions>
            <state_variables>
            {state_variables}
            </state_variables>
            When you believe you understand exactly what the user wants to do:
            - Summarize the chosen method and requirements
            - Ask the user to type "CONFIRM" to proceed
            - Only after receiving "CONFIRM", output the final task in the required JSON format

            Output Format Rules:
            - After confirmation, ONLY output a JSON object
            - Format must be exactly:
                {{
                "should_end": "True",
                "task_determined": final_task
                }}
            - No other text should be included before or after the JSON.
            - The task_determined should clearly specify which tool and method was chosen

            Error Handling:
            - If users request something outside the available options, politely explain what is possible
            - If users seem confused, break down the options into simpler choices
            - If users change their mind, be flexible and help them find the right alternative
            - If users don't type "CONFIRM", continue the conversation without outputting the JSON

            Remember:
            - You always have to greet the user in the first message and ask about their familiarity with web3 ecosystem and not directly jumpt to the task. It should feel very conversational to the user.
            - Only suggest methods that are explicitly listed in the tools. Also not in the same writing style , change it to more converstational.
            - Ask the user if they want to know more in detail.
            - Always verify that required inputs are available before proceeding.
            - Do not mention that you have the sender address in the first message
            - Only output the JSON after receiving "CONFIRM"
            - You are not allowed to say optimal path say , explore all the paths or something like this.
            - Never include any other text with the JSON output
            - Do not mention tools, tell it as options.
            - Do not throw a lot of questions at the user, keep it simple and straight to the point. You can tell them that you can send all the details together as well.


            Example:
            User: "CONFIRM"
            If the user inputs "Confirm", the output should be:
            {{"should_end": "True","task_determined": final_task}}
            Here are some sample final tasks formats you can use:
            Do not use the mentioned data examples in the <sample_final_tasks> tags. They are only for reference.
            <sample_final_tasks>
            {sample_final_tasks}
            </sample_final_tasks>
            Here is all the context you need to have a chat with the user:
            <context>
            {context}
            </context>
            \n
            """.format(context=context , sample_final_tasks=sample_final_tasks , state_variables=state['state_variables'] , important_instructions=important_instructions)

    system_prompt = (
        prompt)
    messages = [SystemMessage(content=system_prompt)] + state["messages"]
    response = model.invoke(messages)
    state["messages"].append(response)
    print(colored(state['state_variables'],"yellow"))
    return state

workflow = StateGraph(state_schema=ChatState)

workflow.add_node("model", call_model)
workflow.add_edge(START, "model")
workflow.add_edge("model",END)

# Add simple in-memory checkpointer
memory = MemorySaver()
def chat_subgraph_wrapper(state):
    app = workflow.compile(checkpointer=memory)
    final_task = []
    init_state = ChatState(
        messages=state['messages'],
        state_variables=str(list(state.keys()))
    )
    config = {"configurable": {"thread_id": state['thread_id']}}
    for state in app.stream(init_state,config):
            ai_response = state['model']['messages'][-1].content
            # print(colored(state['model']['messages'],"red"))
            ai_response= ai_response.replace('```json\n', '').replace('\n```', '')

            try:
                response_data = json.loads(ai_response)
                if response_data['should_end']:
                    final_task.append(response_data.get('task_determined'))
                    print(colored(final_task[-1],"yellow"))
                    obj = {"task_ready":True,"task":final_task[-1]}
            except json.JSONDecodeError:
                obj = {"inner_messages":state['model']['messages']}
                pass
            return obj
            
            

        
