from psycopg_pool import ConnectionPool

import os
from dotenv import load_dotenv

load_dotenv()

NEON_DB_URL = os.getenv("NEON_DB_URL")

connection_kwargs = {
    "autocommit": True,
    "prepare_threshold": 0,
}
connection_pool = ConnectionPool(
    conninfo=NEON_DB_URL,
    max_size=20,
    kwargs=connection_kwargs,
)