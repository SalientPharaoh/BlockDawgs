import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import boto3
import json
from datetime import datetime
import os
from botocore.exceptions import ClientError, NoCredentialsError
from dotenv import load_dotenv
from langchain_core.messages import HumanMessage , AIMessage # Import HumanMessage
from clients import s3_client

# Load environment variables
load_dotenv()


# Constant S3 bucket name
S3_BUCKET_NAME = os.getenv("S3_STATES_BUCKET")  # Replace with your actual bucket name

# Set up logging

class CustomJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, HumanMessage):
            return {
                "type": "HumanMessage",
                "content": obj.content,
                "additional_kwargs": obj.additional_kwargs,
                "example": obj.example
            }
        if isinstance(obj, AIMessage):
            return {
                "type": "AIMessage",
                "content": obj.content,
                "additional_kwargs": obj.additional_kwargs,
                "example": obj.example
            }
        # Add more isinstance checks here for other custom types if needed
        return super().default(obj)

def merge_states(state1, state2):
    """
    Merges two state dictionaries.
    
    Args:
    state1 (dict): First state dictionary
    state2 (dict): Second state dictionary
    
    Returns:
    dict: Merged state dictionary
    """
    merged_state = state1.copy()
    for key, value in state2.items():
        if key in merged_state:
            if isinstance(merged_state[key], list) and isinstance(value, list):
                merged_state[key].extend(value)
            elif isinstance(merged_state[key], dict) and isinstance(value, dict):
                merged_state[key].update(value)
            else:
                merged_state[key] = value
        else:
            merged_state[key] = value
    return merged_state

def log_state_update(state1, state2, file_prefix='merged_state_logs'):
    """
    Merges two states, logs the non-empty elements of the merged state to a text file in the constant AWS S3 bucket.
    
    Args:
    state1 (dict): First state dictionary
    state2 (dict): Second state dictionary
    file_prefix (str): Prefix for the log file name (default: 'merged_state_logs')
    """
    s3 = s3_client.get_s3_client()
    if not s3:
        print("Failed to initialize S3 client. State logging aborted.")
        return

    # Merge states
    merged_state = merge_states(state1, state2)

    # Filter out empty elements
    non_empty_state = {k: v for k, v in merged_state.items() if v}
    userID = non_empty_state["user_id"]
    file_name = f"{userID}/state_logs.json"

    # Convert the state to a formatted string using the custom encoder
    try:
        state_str = json.dumps(non_empty_state, indent=2, cls=CustomJSONEncoder)
    except TypeError as e:
        print(f"Error during JSON serialization: {str(e)}")
        return

    # Upload the file to S3
    print(f"Logging state to s3://{S3_BUCKET_NAME}/{file_name}")
    print("Putting object to S3.......")
    try:
        s3.put_object(Bucket=S3_BUCKET_NAME, Key=file_name, Body=state_str)
        print(f"Merged state logged successfully to s3://{S3_BUCKET_NAME}/{file_name}")
    except ClientError as e:
        print(f"An error occurred while logging merged state to S3: {str(e)}")
    except Exception as e:
        print(f"An unexpected error occurred: {str(e)}")

