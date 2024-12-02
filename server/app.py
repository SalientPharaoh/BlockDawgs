from langchain_core.messages import BaseMessage, HumanMessage, ToolMessage, AIMessage
from langgraph.prebuilt import ToolNode
from typing import Annotated, Sequence, Literal, Dict, Any
from dotenv import load_dotenv
import os
import json
from core.parent_graph import run_agent



# Load environment variables from .env file
load_dotenv()

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import StreamingResponse

app = FastAPI()
from fastapi.middleware.cors import CORSMiddleware

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)



def convert_langchain_message_to_vercel_message(message: BaseMessage) -> Dict[str, Any]:
    if isinstance(message, HumanMessage):
        return {"content": message.content, "role": "user"}
    elif isinstance(message, AIMessage):
        if "hehehehe" in message.content:
            print
            message_string = message.content.split("hehehehe")[0]
            optimal_path = message.content.split("hehehehe")[1]
            print(colored(optimal_path,"red"))
            print(colored(type(optimal_path),"red"))
            # optimal_path = json.loads(optimal_path)
            return {
                "content": message_string,
                "role": "assistant",
                "execute_path": optimal_path
            }
        return {
                "content": message.content,
                "role": "assistant",
            }
    elif isinstance(message, dict):
        if 'optimal_path' in message :
            return {"isExecute":True , "executePath":message['optimal_path']}
  
from termcolor import colored
@app.post("/api/chat")
async def process_request(request: Request):
    body = await request.json()
    messages = body.get("messages")
    user_input = messages[-1]["content"]
    thread_id_provider = body.get("thread_id")
    formatted_query = f"{user_input}"
    
    async def event_generator():
        async for event in run_agent(formatted_query,thread_id_provider):
            print(colored(event,"magenta"))
            converted_reply = convert_langchain_message_to_vercel_message(event)
            yield f"data: {json.dumps(converted_reply)}\n\n"

       
    return StreamingResponse(event_generator(), media_type="text/plain")

@app.get("/")
async def root():
    return {"message": "API is running"}

@app.get("/health")  # Changed from route to get
async def health():
    return {'status': 'healthy'}
# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)