from langchain_together import ChatTogether
from .state import ReWOO
import os
from dotenv import load_dotenv
from termcolor import colored
load_dotenv()

model = ChatTogether(
    api_key = os.getenv("TOGETHER_API_KEY"),
    model="meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo",
    temperature=0,
    max_tokens=None,
    timeout=None,
    max_retries=2,
)

all_variables = ""
# These are all the variables in the state: {all_variables}
prompt = """For the following task, make plans that can solve the problem step by step. For each plan, indicate 
which external tool together with tool input to retrieve evidence. You can store the evidence into a 
variable #E that can be called by later tools. (Plan, #E1, Plan, #E2, Plan, ...)
Only do what the user has requested and the task requires, Nothing else.

You are working with the web3 ecosystem here.
You also have to keep in mind the variables whose values we have.

Universal Instructions:
1.For any transaction to happen all this is mandatorily required:
<requirements>
{data_format}
</requirements>
2. If you are not given with some values you are not allowed to assume then.
3. Rules for the inputs:
        1. You are only allowed to accept 3 tokens right now: USDC, USDT , ETH. If user requests any other token then ask them that we only support USDC, USDT and ETH in a friendly way.
        2. You are only allowed to accept 3 chains right now: Polygon, Base , Avalanche. If user requests any other chain then ask them that we only support Ethereum, Base and Avalanche in a friendly way.


Tools:
(1) Optimal_Path_SameChainSelf[INPUTS]: It is a subgraph which generates optimal paths. It is 
useful when you need want to determine the most optimal path to complete a transaction on the same blockchain or want to swap tokens.
Inputs are "fromToken", "senderAddress", "toToken", "receiverAddress", "fromChainName", "toChainName", "inputAmount".

(2) Optimal_Path_SameChainOther[INPUTS]: It is a subgraph which generates optimal paths. It is 
useful when you need want to determine the most optimal path to complete a transaction on the same blockchain but to a different address .
Inputs are "fromToken", "senderAddress", "toToken", "receiverAddress", "fromChainName", "toChainName", "inputAmount".

(3) Optimal_Path_CrossChain[INPUTS]: It is a subgraph which generates optimal paths. It is 
useful when you need want to determine the most optimal path to complete a transaction on the different blockchain.
Inputs are "fromToken", "senderAddress", "toToken", "receiverAddress", "fromChainName", "toChainName", "inputAmount".
    If any of the universal inputs is missing then ask then user to provide what is missing.

Note: Select the method that best matches the user's request, even if not explicitly specified.

For example,
    Task: A community pool charges different rates for adults, seniors, and children. Adult tickets cost $x. Senior tickets cost $3 less than adult tickets, and children's tickets cost half of a senior ticket. On Saturday, they sold 45 adult tickets, 30 senior tickets, and 60 children's tickets, making a total of $1,575. The manager needs to give 15% of this to maintenance, 25% to staff salaries, and puts 30% into savings. How much money is left for miscellaneous expenses?
    Plan: Given adult tickets cost $x, translate the problem into algebraic expressions and solve with Wolfram Alpha. #E1 = WolframAlpha[Solve 45x + 30(x-3) + 60((x-3)/2) = 1575]
    Plan: Find the adult ticket price. #E2 = LLM[What is x, given #E1]
    Plan: Calculate the children's ticket price based on senior price. #E3 = Calculator[(#E2 - 3)/2]
    Plan: Calculate total revenue to verify. #E4 = Calculator[45*#E2 + 30*(#E2-3) + 60*#E3]
    Plan: Calculate maintenance portion. #E5 = Calculator[#E4 * 0.15]
    Plan: Calculate staff salaries portion. #E6 = Calculator[#E4 * 0.25]
    Plan: Calculate savings portion. #E7 = Calculator[#E4 * 0.30]
    Plan: Calculate remaining money for miscellaneous expenses. #E8 = Calculator[#E4 - (#E5 + #E6 + #E7)]
    Note: There can be a maximum of 10 #Es in a plan.


Begin! 
Each Plan should be followed by only one #E. 
Sample for #E1 = Optimal_Path_CrossChain[ETH, 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48, ETH, 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2, BASE, POLYGON,20000000]
The only valid structure of the plan should be as shown below.
Example for #E(1,2,3.....100) = (Only the name of the tool not the method)[inputs]: #E(1,2,3.....100) =  Optimal_Path_CrossChain[fromToken, senderAddress, toToken, receiverAddress, fromChainName, toChainName, inputAmount]
Invalid plans : 
    #E(1,2,3.....100) = Reviews[s3://research-agent-datafiles/uploads/d53dbfae-5d23-4579-adae-d0cc077a0f28.csv, Method 1]
    #E(1,2,3.....100) = Persona Attributes with product brief Method[s3://research-agent-datafiles/uploads/d53dbfae-5d23-4579-adae-d0cc077a0f28.csv, comments]
    #E(1,2,3.....100) = Marketing_Angle.A.Product_Brief Method[#E1]
    #E(1,2,3.....100) = Marketing[inputs: s3://research-agent-datafiles/uploads/d53dbfae-5d23-4579-adae-d0cc077a0f28.csv, comments]
Only user given inputs should be present inside the plan. Do not write any details of the plan in inputs.
Task: {task}"""
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
# result = model.invoke(prompt.format(task=task))
# print(result.content)


import re
from langchain_core.prompts import ChatPromptTemplate



def get_plan(state: ReWOO):
    # Regex to match expressions of the form E#... = ...[...]
    regex_pattern = r"Plan:\s*(.+)\s*(#E\d+)\s*=\s*(\w+)\s*\[([^\]]+)\]"
    prompt_template = ChatPromptTemplate.from_messages([("user", prompt)])
    planner = prompt_template | model
    print(colored("---Planning Node---", "light_blue"))
    task = state["task"]
    # all_variables = list(state.keys())
    print(colored(all_variables, "light_blue"))
    result = planner.invoke({"task": task , "data_format":data_format })
    # Find all matches in the sample text
    print(colored(result.content, "red"))
    matches = re.findall(regex_pattern, result.content)
    print(colored(matches, "magenta"))
    state['steps'] = matches
    state['plan_string'] = result.content
    return state

# Example usage
# task = """ I want to swap 2 USDT to USDC on ethereum 
#     "sourceChainId": 1,
#     "sourceTokenAddress": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
#     "destinationChainId": 1,
#     "destinationTokenAddress": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
#     "inputAmount": "20000000"
#     """
# task = "Convert 75 USDT to USDC on Avalanche using address 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2 as sender and receiver"
# state = {
#     "task":task,
#     "plan_string": "",
#     "steps": [],
#     "results": {},
#     "result": "",
# }
# print(get_plan(state))