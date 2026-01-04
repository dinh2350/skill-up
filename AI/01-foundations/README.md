# Phase 1: Foundations

## 📋 Overview

Phase 1 establishes the essential foundation for becoming an AI Engineer. You'll learn Python programming, understand AI concepts and terminology, and set up your development environment.

**Duration:** 1-2 months  
**Level:** Beginner  
**Prerequisites:** Basic computer literacy

---

## 🎯 Learning Objectives

By the end of Phase 1, you will be able to:

- ✅ Write Python code confidently
- ✅ Work with data structures and APIs
- ✅ Understand AI, ML, and LLM terminology
- ✅ Explain the difference between AI, ML, DL, and AGI
- ✅ Set up a professional development environment
- ✅ Use Git for version control
- ✅ Make your first API calls

---

## 📚 Table of Contents

1. [Python Programming](#1-python-programming)
2. [Data Structures](#2-data-structures)
3. [Working with APIs](#3-working-with-apis)
4. [Async Programming](#4-async-programming)
5. [AI Fundamentals](#5-ai-fundamentals)
6. [Common AI Terminology](#6-common-ai-terminology)
7. [Development Environment](#7-development-environment)
8. [Version Control with Git](#8-version-control-with-git)
9. [Practice Projects](#9-practice-projects)

---

## 1. Python Programming

### Why Python for AI?

Python is the dominant language in AI/ML due to:
- Simple, readable syntax
- Rich ecosystem of AI libraries
- Strong community support
- Integration with all major AI APIs

### Python Basics

```python
# Variables and Types
name = "AI Engineer"          # String
age = 25                      # Integer
salary = 75000.50             # Float
is_employed = True            # Boolean
skills = None                 # NoneType

# Type checking
print(type(name))             # <class 'str'>
print(isinstance(age, int))   # True

# String formatting (f-strings)
message = f"Hello, I'm a {name} and I'm {age} years old."
print(message)

# Multi-line strings (useful for prompts!)
prompt = """
You are a helpful assistant.
Please respond in a friendly manner.
Keep responses concise.
"""
```

### Control Flow

```python
# If/Elif/Else
def get_model_tier(tokens):
    if tokens < 1000:
        return "small"
    elif tokens < 10000:
        return "medium"
    else:
        return "large"

# Match statement (Python 3.10+)
def get_provider(model_name):
    match model_name:
        case "gpt-4" | "gpt-3.5-turbo":
            return "OpenAI"
        case "claude-3" | "claude-2":
            return "Anthropic"
        case "gemini-pro":
            return "Google"
        case _:
            return "Unknown"

# Loops
models = ["gpt-4", "claude-3", "gemini-pro"]

for model in models:
    print(f"Processing: {model}")

# List comprehension
model_lengths = [len(m) for m in models]

# Enumerate for index + value
for i, model in enumerate(models):
    print(f"{i}: {model}")

# While loop with break
attempts = 0
while attempts < 3:
    result = call_api()
    if result.success:
        break
    attempts += 1
```

### Functions

```python
# Basic function
def greet(name: str) -> str:
    """Generate a greeting message."""
    return f"Hello, {name}!"

# Default parameters
def call_llm(prompt: str, model: str = "gpt-4", temperature: float = 0.7):
    """Call an LLM with the given parameters."""
    return {
        "prompt": prompt,
        "model": model,
        "temperature": temperature
    }

# *args and **kwargs
def create_message(*args, **kwargs):
    """Flexible function signature."""
    print(f"Args: {args}")
    print(f"Kwargs: {kwargs}")

create_message("hello", "world", role="user", content="Hi!")

# Lambda functions
clean_text = lambda text: text.strip().lower()
tokens = ["  Hello  ", "WORLD  "]
cleaned = list(map(clean_text, tokens))

# Higher-order functions
def retry(func, attempts=3):
    """Retry a function multiple times."""
    def wrapper(*args, **kwargs):
        for i in range(attempts):
            try:
                return func(*args, **kwargs)
            except Exception as e:
                if i == attempts - 1:
                    raise e
                print(f"Attempt {i+1} failed, retrying...")
    return wrapper

@retry
def unstable_api_call():
    # Simulating an unreliable API
    pass
```

### Classes and OOP

```python
from dataclasses import dataclass
from typing import Optional, List

# Traditional class
class ChatMessage:
    def __init__(self, role: str, content: str):
        self.role = role
        self.content = content
    
    def to_dict(self) -> dict:
        return {"role": self.role, "content": self.content}
    
    def __repr__(self):
        return f"ChatMessage(role='{self.role}', content='{self.content[:50]}...')"

# Dataclass (recommended for data containers)
@dataclass
class LLMResponse:
    content: str
    model: str
    tokens_used: int
    finish_reason: str
    metadata: Optional[dict] = None

# Usage
response = LLMResponse(
    content="Hello! How can I help you?",
    model="gpt-4",
    tokens_used=150,
    finish_reason="stop"
)

# Inheritance
class BaseProvider:
    def __init__(self, api_key: str):
        self.api_key = api_key
    
    def complete(self, prompt: str) -> str:
        raise NotImplementedError

class OpenAIProvider(BaseProvider):
    def complete(self, prompt: str) -> str:
        # OpenAI-specific implementation
        return f"OpenAI response to: {prompt}"

class AnthropicProvider(BaseProvider):
    def complete(self, prompt: str) -> str:
        # Anthropic-specific implementation
        return f"Anthropic response to: {prompt}"
```

### Error Handling

```python
import time
from typing import Optional

# Basic try/except
def safe_parse_json(text: str) -> Optional[dict]:
    try:
        import json
        return json.loads(text)
    except json.JSONDecodeError as e:
        print(f"Failed to parse JSON: {e}")
        return None

# Multiple exception types
def call_api_with_handling(url: str):
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        return response.json()
    except requests.Timeout:
        print("Request timed out")
    except requests.HTTPError as e:
        print(f"HTTP error: {e.response.status_code}")
    except requests.RequestException as e:
        print(f"Request failed: {e}")
    finally:
        print("Request completed")

# Custom exceptions
class AIError(Exception):
    """Base exception for AI operations."""
    pass

class TokenLimitExceeded(AIError):
    """Raised when token limit is exceeded."""
    def __init__(self, tokens_used: int, limit: int):
        self.tokens_used = tokens_used
        self.limit = limit
        super().__init__(f"Token limit exceeded: {tokens_used}/{limit}")

class RateLimitError(AIError):
    """Raised when rate limit is hit."""
    def __init__(self, retry_after: int):
        self.retry_after = retry_after
        super().__init__(f"Rate limited. Retry after {retry_after} seconds")

# Using custom exceptions
def generate_response(prompt: str, max_tokens: int = 1000):
    tokens = count_tokens(prompt)
    if tokens > max_tokens:
        raise TokenLimitExceeded(tokens, max_tokens)
    
    try:
        return call_llm(prompt)
    except RateLimitError as e:
        time.sleep(e.retry_after)
        return call_llm(prompt)
```

---

## 2. Data Structures

### Lists

```python
# Creating lists
models = ["gpt-4", "gpt-3.5-turbo", "claude-3"]
empty_list = []
numbers = list(range(1, 11))

# List operations
models.append("gemini-pro")           # Add to end
models.insert(0, "gpt-4-turbo")       # Add at index
models.extend(["llama-3", "mistral"]) # Add multiple
removed = models.pop()                 # Remove and return last
models.remove("gpt-3.5-turbo")        # Remove by value

# Slicing
first_two = models[:2]
last_two = models[-2:]
every_other = models[::2]
reversed_list = models[::-1]

# List comprehensions
# Basic
lengths = [len(m) for m in models]

# With condition
gpt_models = [m for m in models if m.startswith("gpt")]

# Nested comprehension
matrix = [[i * j for j in range(3)] for i in range(3)]

# Useful list methods
models.sort()                          # Sort in place
sorted_models = sorted(models)         # Return new sorted list
models.reverse()                       # Reverse in place
count = models.count("gpt-4")          # Count occurrences
index = models.index("gpt-4")          # Find index
```

### Dictionaries

```python
# Creating dictionaries
config = {
    "model": "gpt-4",
    "temperature": 0.7,
    "max_tokens": 1000,
    "stream": False
}

# Alternative creation
config = dict(model="gpt-4", temperature=0.7)

# Accessing values
model = config["model"]                # Raises KeyError if missing
model = config.get("model")            # Returns None if missing
model = config.get("model", "default") # Returns default if missing

# Modifying
config["top_p"] = 0.9                  # Add or update
config.update({"presence_penalty": 0.5, "frequency_penalty": 0.5})
del config["stream"]                   # Delete key
value = config.pop("top_p", None)      # Remove and return

# Iterating
for key in config:
    print(key)

for key, value in config.items():
    print(f"{key}: {value}")

for value in config.values():
    print(value)

# Dictionary comprehensions
# Create from lists
models = ["gpt-4", "claude-3", "gemini"]
prices = [0.03, 0.015, 0.001]
model_prices = {m: p for m, p in zip(models, prices)}

# Filter dictionary
expensive_models = {k: v for k, v in model_prices.items() if v > 0.01}

# Nested dictionaries (common in AI configs)
llm_config = {
    "openai": {
        "api_key": "sk-...",
        "models": {
            "gpt-4": {"max_tokens": 8192, "price": 0.03},
            "gpt-3.5-turbo": {"max_tokens": 4096, "price": 0.002}
        }
    },
    "anthropic": {
        "api_key": "sk-ant-...",
        "models": {
            "claude-3-opus": {"max_tokens": 200000, "price": 0.015}
        }
    }
}

# Safe nested access
gpt4_price = llm_config.get("openai", {}).get("models", {}).get("gpt-4", {}).get("price")
```

### Sets and Tuples

```python
# Sets - unordered, unique elements
unique_models = {"gpt-4", "claude-3", "gpt-4", "gemini"}
print(unique_models)  # {'gpt-4', 'claude-3', 'gemini'}

# Set operations
set_a = {"gpt-4", "claude-3", "gemini"}
set_b = {"gpt-4", "llama-3", "mistral"}

union = set_a | set_b              # All elements
intersection = set_a & set_b       # Common elements
difference = set_a - set_b         # In A but not B
symmetric_diff = set_a ^ set_b     # In A or B, not both

# Set for deduplication
responses = ["Hello", "Hello", "Hi", "Hello"]
unique_responses = list(set(responses))

# Tuples - immutable sequences
point = (10, 20)
model_info = ("gpt-4", "OpenAI", 0.03)

# Named tuples
from collections import namedtuple

ModelInfo = namedtuple("ModelInfo", ["name", "provider", "price"])
gpt4 = ModelInfo("gpt-4", "OpenAI", 0.03)
print(gpt4.name)      # "gpt-4"
print(gpt4.provider)  # "OpenAI"

# Tuple unpacking
name, provider, price = gpt4
x, y = point
```

### Working with JSON

```python
import json
from typing import Any

# Parse JSON string
json_string = '{"model": "gpt-4", "temperature": 0.7}'
data = json.loads(json_string)

# Convert to JSON string
config = {"model": "gpt-4", "messages": [{"role": "user", "content": "Hello"}]}
json_output = json.dumps(config)
pretty_json = json.dumps(config, indent=2)

# Read/Write JSON files
def load_config(path: str) -> dict:
    with open(path, 'r') as f:
        return json.load(f)

def save_config(config: dict, path: str) -> None:
    with open(path, 'w') as f:
        json.dump(config, f, indent=2)

# Handle special types
from datetime import datetime

class AIEncoder(json.JSONEncoder):
    def default(self, obj: Any) -> Any:
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)

data = {"timestamp": datetime.now(), "model": "gpt-4"}
json_str = json.dumps(data, cls=AIEncoder)
```

---

## 3. Working with APIs

### HTTP Fundamentals

```python
"""
HTTP Methods:
- GET: Retrieve data
- POST: Send data (most common for AI APIs)
- PUT: Update data
- DELETE: Remove data

Status Codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 429: Rate Limited
- 500: Server Error
"""

import requests
from typing import Optional

# Basic GET request
def fetch_data(url: str) -> dict:
    response = requests.get(url)
    response.raise_for_status()  # Raise exception for 4xx/5xx
    return response.json()

# POST request with JSON body
def post_data(url: str, data: dict) -> dict:
    response = requests.post(
        url,
        json=data,  # Automatically sets Content-Type header
        headers={"Authorization": "Bearer YOUR_API_KEY"}
    )
    response.raise_for_status()
    return response.json()

# Request with timeout and error handling
def safe_request(url: str, timeout: int = 30) -> Optional[dict]:
    try:
        response = requests.get(url, timeout=timeout)
        response.raise_for_status()
        return response.json()
    except requests.Timeout:
        print("Request timed out")
    except requests.HTTPError as e:
        print(f"HTTP error: {e}")
    except requests.RequestException as e:
        print(f"Request failed: {e}")
    return None
```

### Making API Calls

```python
import requests
import os
from typing import List, Dict

# Environment variables for API keys
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

def chat_completion(
    messages: List[Dict[str, str]],
    model: str = "gpt-3.5-turbo",
    temperature: float = 0.7
) -> str:
    """Make a chat completion request to OpenAI."""
    
    url = "https://api.openai.com/v1/chat/completions"
    
    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": model,
        "messages": messages,
        "temperature": temperature
    }
    
    response = requests.post(url, headers=headers, json=payload)
    response.raise_for_status()
    
    data = response.json()
    return data["choices"][0]["message"]["content"]

# Usage
messages = [
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "What is machine learning?"}
]

response = chat_completion(messages)
print(response)
```

### Retry Logic and Rate Limiting

```python
import time
import requests
from functools import wraps
from typing import Callable, Any

def retry_with_backoff(
    max_retries: int = 3,
    initial_delay: float = 1.0,
    backoff_factor: float = 2.0,
    retryable_exceptions: tuple = (requests.RequestException,)
):
    """Decorator for retrying failed API calls with exponential backoff."""
    
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs) -> Any:
            delay = initial_delay
            last_exception = None
            
            for attempt in range(max_retries):
                try:
                    return func(*args, **kwargs)
                except retryable_exceptions as e:
                    last_exception = e
                    
                    if attempt < max_retries - 1:
                        print(f"Attempt {attempt + 1} failed. Retrying in {delay}s...")
                        time.sleep(delay)
                        delay *= backoff_factor
            
            raise last_exception
        
        return wrapper
    return decorator

@retry_with_backoff(max_retries=3)
def call_api(url: str) -> dict:
    response = requests.get(url, timeout=10)
    response.raise_for_status()
    return response.json()

# Rate limiter using token bucket
class RateLimiter:
    def __init__(self, requests_per_minute: int):
        self.requests_per_minute = requests_per_minute
        self.interval = 60.0 / requests_per_minute
        self.last_request_time = 0
    
    def wait(self):
        """Wait if necessary to respect rate limit."""
        current_time = time.time()
        elapsed = current_time - self.last_request_time
        
        if elapsed < self.interval:
            time.sleep(self.interval - elapsed)
        
        self.last_request_time = time.time()

# Usage
limiter = RateLimiter(requests_per_minute=60)

for i in range(100):
    limiter.wait()
    response = call_api(url)
```

---

## 4. Async Programming

### Why Async for AI Applications?

Async programming is essential for AI applications because:
- API calls are I/O bound (waiting for network responses)
- Multiple requests can be made concurrently
- Better resource utilization
- Improved throughput

### Async Basics

```python
import asyncio
from typing import List

# Basic async function
async def fetch_data(url: str) -> dict:
    """Async function that simulates an API call."""
    await asyncio.sleep(1)  # Simulate network delay
    return {"url": url, "data": "result"}

# Running async functions
async def main():
    result = await fetch_data("https://api.example.com")
    print(result)

# Run the async function
asyncio.run(main())

# Multiple concurrent requests
async def fetch_all(urls: List[str]) -> List[dict]:
    """Fetch multiple URLs concurrently."""
    tasks = [fetch_data(url) for url in urls]
    results = await asyncio.gather(*tasks)
    return results

# Example usage
urls = [
    "https://api.example.com/1",
    "https://api.example.com/2",
    "https://api.example.com/3"
]

results = asyncio.run(fetch_all(urls))
# All three requests complete in ~1 second instead of ~3 seconds
```

### Async HTTP with aiohttp

```python
import aiohttp
import asyncio
from typing import List, Dict

async def fetch_json(session: aiohttp.ClientSession, url: str) -> dict:
    """Fetch JSON from a URL using aiohttp."""
    async with session.get(url) as response:
        return await response.json()

async def post_json(
    session: aiohttp.ClientSession,
    url: str,
    data: dict,
    headers: dict = None
) -> dict:
    """POST JSON data using aiohttp."""
    async with session.post(url, json=data, headers=headers) as response:
        return await response.json()

async def fetch_multiple(urls: List[str]) -> List[dict]:
    """Fetch multiple URLs concurrently."""
    async with aiohttp.ClientSession() as session:
        tasks = [fetch_json(session, url) for url in urls]
        return await asyncio.gather(*tasks)

# Async context manager for API client
class AsyncOpenAIClient:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.openai.com/v1"
        self.session = None
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession(
            headers={"Authorization": f"Bearer {self.api_key}"}
        )
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.session.close()
    
    async def chat(self, messages: List[Dict]) -> str:
        url = f"{self.base_url}/chat/completions"
        payload = {
            "model": "gpt-3.5-turbo",
            "messages": messages
        }
        async with self.session.post(url, json=payload) as response:
            data = await response.json()
            return data["choices"][0]["message"]["content"]

# Usage
async def main():
    async with AsyncOpenAIClient("your-api-key") as client:
        response = await client.chat([
            {"role": "user", "content": "Hello!"}
        ])
        print(response)

asyncio.run(main())
```

### Async Patterns for AI

```python
import asyncio
from typing import List, AsyncIterator

# Semaphore for rate limiting
async def rate_limited_calls(
    prompts: List[str],
    max_concurrent: int = 5
) -> List[str]:
    """Process prompts with limited concurrency."""
    semaphore = asyncio.Semaphore(max_concurrent)
    
    async def process_with_limit(prompt: str) -> str:
        async with semaphore:
            return await call_llm_async(prompt)
    
    tasks = [process_with_limit(p) for p in prompts]
    return await asyncio.gather(*tasks)

# Async generator for streaming
async def stream_response(prompt: str) -> AsyncIterator[str]:
    """Stream response tokens."""
    # Simulated streaming response
    words = ["Hello", "!", " How", " can", " I", " help", " you", "?"]
    for word in words:
        await asyncio.sleep(0.1)
        yield word

# Consuming async generator
async def print_stream():
    async for token in stream_response("Hello"):
        print(token, end="", flush=True)
    print()

# Timeout for slow operations
async def call_with_timeout(prompt: str, timeout: float = 30.0) -> str:
    """Call LLM with timeout."""
    try:
        result = await asyncio.wait_for(
            call_llm_async(prompt),
            timeout=timeout
        )
        return result
    except asyncio.TimeoutError:
        raise TimeoutError(f"LLM call timed out after {timeout}s")

# Batch processing
async def process_in_batches(
    items: List[str],
    batch_size: int = 10
) -> List[str]:
    """Process items in batches."""
    results = []
    
    for i in range(0, len(items), batch_size):
        batch = items[i:i + batch_size]
        batch_results = await asyncio.gather(
            *[process_item(item) for item in batch]
        )
        results.extend(batch_results)
        
        # Optional: delay between batches
        await asyncio.sleep(1)
    
    return results
```

---

## 5. AI Fundamentals

### What is AI?

```
┌─────────────────────────────────────────────────────────────────┐
│                    Artificial Intelligence                       │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                   Machine Learning                         │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │                  Deep Learning                       │  │  │
│  │  │  ┌───────────────────────────────────────────────┐  │  │  │
│  │  │  │          Large Language Models                 │  │  │  │
│  │  │  │     (GPT, Claude, Llama, Gemini)              │  │  │  │
│  │  │  └───────────────────────────────────────────────┘  │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Key Concepts

| Term | Definition | Example |
|------|------------|---------|
| **AI** | Systems that can perform tasks requiring human intelligence | Chess engines, voice assistants |
| **ML** | AI that learns from data without explicit programming | Spam filters, recommendations |
| **DL** | ML using neural networks with many layers | Image recognition, language models |
| **LLM** | Large neural networks trained on text data | GPT-4, Claude, Llama |
| **AGI** | Hypothetical AI with human-level general intelligence | Does not exist yet |

### How LLMs Work

```
Input: "What is the capital of France?"
         │
         ▼
┌─────────────────┐
│   Tokenization  │  Split text into tokens
│  ["What", "is", │  
│   "the", ...]   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Embeddings    │  Convert tokens to vectors
│  [0.2, -0.5,    │  
│   0.8, ...]     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Transformer    │  Process through neural network
│  Architecture   │  (attention mechanism)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Probability    │  Predict next token
│  Distribution   │  probabilities
└────────┬────────┘
         │
         ▼
Output: "Paris"
```

### Training vs Inference

```
Training (done by AI companies):
────────────────────────────────
• Requires massive compute (millions of dollars)
• Uses huge datasets (trillions of tokens)
• Takes weeks to months
• Updates model weights
• Done once, then frozen

Inference (what AI Engineers do):
─────────────────────────────────
• Uses trained model
• Processes new inputs
• Generates outputs
• Fast (milliseconds to seconds)
• Pay-per-use pricing
```

### AI vs AGI

| Aspect | Current AI (Narrow AI) | AGI (Artificial General Intelligence) |
|--------|------------------------|---------------------------------------|
| **Scope** | Specific tasks | Any intellectual task |
| **Learning** | Task-specific training | Transfer learning across domains |
| **Common Sense** | Limited | Human-level understanding |
| **Creativity** | Pattern-based | Original thinking |
| **Status** | Exists today | Theoretical/Future |

---

## 6. Common AI Terminology

### LLM Terminology

```python
# Tokens
"""
Tokens are the basic units of text that LLMs process.
- ~4 characters = 1 token (English)
- "Hello, world!" = ~4 tokens
- Code and other languages may have different ratios
"""

# Example token counting
text = "Hello, how are you doing today?"
# Approximate: 8 tokens

# Context Window
"""
The maximum number of tokens an LLM can process at once.
- GPT-4: 8K - 128K tokens
- Claude 3: up to 200K tokens
- Gemini 1.5: up to 1M tokens
"""

# Temperature
"""
Controls randomness in outputs (0.0 - 2.0):
- 0.0: Deterministic, most likely output
- 0.7: Balanced creativity (common default)
- 1.0+: More random, creative
"""

temperature_examples = {
    0.0: "Best for: Factual Q&A, code generation",
    0.3: "Best for: Data extraction, summarization",
    0.7: "Best for: General conversation, creative writing",
    1.0: "Best for: Brainstorming, poetry"
}

# Top-p (Nucleus Sampling)
"""
Alternative to temperature:
- Considers only tokens comprising top p probability mass
- top_p=0.9: Consider tokens that make up 90% of probability
"""

# Prompts
"""
System Prompt: Sets behavior and context
User Prompt: The actual question or task
Assistant: The model's response
"""

messages = [
    {"role": "system", "content": "You are a helpful coding assistant."},
    {"role": "user", "content": "Write a Python function to sort a list."},
    {"role": "assistant", "content": "def sort_list(lst): return sorted(lst)"},
    {"role": "user", "content": "Now make it sort in descending order."}
]
```

### Model Terminology

```python
# Model Capabilities
capabilities = {
    "text-generation": "Generating text responses",
    "code-generation": "Writing and explaining code",
    "summarization": "Condensing long texts",
    "translation": "Converting between languages",
    "classification": "Categorizing text",
    "embedding": "Converting text to vectors",
    "vision": "Understanding images",
    "function-calling": "Calling external tools/APIs"
}

# Fine-tuning
"""
Customizing a pre-trained model with specific data:
- Uses smaller dataset (hundreds to thousands of examples)
- Adapts model to specific tasks or styles
- Much cheaper than training from scratch
"""

# RAG (Retrieval Augmented Generation)
"""
Combining LLMs with external knowledge:
1. User asks question
2. Retrieve relevant documents
3. Include documents in prompt
4. LLM generates informed response
"""

# Embeddings
"""
Vector representations of text:
- Enable semantic similarity search
- Used for RAG, classification, clustering
- Typically 1536 dimensions (OpenAI) or 768 (many open source)
"""

# Hallucination
"""
When LLMs generate false or nonsensical information:
- Models can confidently state wrong facts
- Common with rare topics or specific details
- Mitigated with RAG, fact-checking, or lower temperature
"""
```

### Pricing and Limits

```python
# Token-based pricing (example rates, check current prices)
pricing = {
    "gpt-4": {
        "input": 0.03,    # per 1K tokens
        "output": 0.06    # per 1K tokens
    },
    "gpt-3.5-turbo": {
        "input": 0.0005,
        "output": 0.0015
    },
    "claude-3-opus": {
        "input": 0.015,
        "output": 0.075
    }
}

# Cost calculation
def estimate_cost(input_tokens: int, output_tokens: int, model: str) -> float:
    rates = pricing.get(model, pricing["gpt-3.5-turbo"])
    input_cost = (input_tokens / 1000) * rates["input"]
    output_cost = (output_tokens / 1000) * rates["output"]
    return input_cost + output_cost

# Example
cost = estimate_cost(
    input_tokens=1000,
    output_tokens=500,
    model="gpt-4"
)
print(f"Estimated cost: ${cost:.4f}")  # $0.06
```

---

## 7. Development Environment

### Python Setup

```bash
# Install Python 3.10+ (using pyenv recommended)
# macOS
brew install pyenv
pyenv install 3.11.0
pyenv global 3.11.0

# Verify installation
python --version  # Python 3.11.0
```

### Virtual Environments

```bash
# Create virtual environment
python -m venv .venv

# Activate (macOS/Linux)
source .venv/bin/activate

# Activate (Windows)
.venv\Scripts\activate

# Install packages
pip install openai requests python-dotenv

# Save dependencies
pip freeze > requirements.txt

# Install from requirements
pip install -r requirements.txt

# Deactivate
deactivate
```

### Project Structure

```
my-ai-project/
├── .venv/                  # Virtual environment
├── .env                    # Environment variables (API keys)
├── .env.example            # Template for .env
├── .gitignore              # Git ignore file
├── requirements.txt        # Dependencies
├── README.md               # Project documentation
├── src/
│   ├── __init__.py
│   ├── client.py           # API client
│   ├── prompts.py          # Prompt templates
│   └── utils.py            # Helper functions
├── tests/
│   ├── __init__.py
│   └── test_client.py
└── notebooks/
    └── experiments.ipynb   # Jupyter notebooks
```

### Environment Variables

```python
# .env file (never commit this!)
OPENAI_API_KEY=sk-your-key-here
ANTHROPIC_API_KEY=sk-ant-your-key
DEBUG=true

# .env.example (commit this as a template)
OPENAI_API_KEY=sk-your-key-here
ANTHROPIC_API_KEY=sk-ant-your-key
DEBUG=false

# Load environment variables
from dotenv import load_dotenv
import os

load_dotenv()  # Load from .env file

api_key = os.getenv("OPENAI_API_KEY")
debug = os.getenv("DEBUG", "false").lower() == "true"

# Validate required variables
def validate_env():
    required = ["OPENAI_API_KEY"]
    missing = [var for var in required if not os.getenv(var)]
    if missing:
        raise EnvironmentError(f"Missing required env vars: {missing}")

validate_env()
```

### .gitignore

```gitignore
# Virtual environment
.venv/
venv/
env/

# Environment variables
.env
.env.local

# Python
__pycache__/
*.py[cod]
*.egg-info/
dist/
build/

# IDE
.vscode/
.idea/
*.swp

# Jupyter
.ipynb_checkpoints/

# OS
.DS_Store
Thumbs.db

# Logs
*.log
logs/

# Data (be careful with sensitive data)
data/
*.csv
*.json
```

---

## 8. Version Control with Git

### Git Basics

```bash
# Initialize repository
git init

# Configure user
git config --global user.name "Your Name"
git config --global user.email "your@email.com"

# Check status
git status

# Stage changes
git add filename.py          # Specific file
git add .                    # All changes
git add -p                   # Interactive staging

# Commit changes
git commit -m "Add chat completion function"

# View history
git log                      # Full log
git log --oneline            # Compact log
git log -5                   # Last 5 commits

# View changes
git diff                     # Unstaged changes
git diff --staged            # Staged changes
git diff HEAD~1              # Compare with previous commit
```

### Branching

```bash
# Create and switch to branch
git checkout -b feature/add-streaming

# Switch branches
git checkout main

# List branches
git branch                   # Local
git branch -r                # Remote
git branch -a                # All

# Merge branch
git checkout main
git merge feature/add-streaming

# Delete branch
git branch -d feature/add-streaming

# Rename branch
git branch -m old-name new-name
```

### Working with Remote

```bash
# Add remote
git remote add origin https://github.com/username/repo.git

# View remotes
git remote -v

# Push to remote
git push origin main
git push -u origin main      # Set upstream

# Pull from remote
git pull origin main

# Fetch without merging
git fetch origin

# Clone repository
git clone https://github.com/username/repo.git
```

### Common Workflows

```bash
# Feature branch workflow
git checkout main
git pull origin main
git checkout -b feature/new-feature
# ... make changes ...
git add .
git commit -m "Add new feature"
git push origin feature/new-feature
# Create Pull Request on GitHub

# Undo changes
git checkout -- filename.py  # Discard unstaged changes
git reset HEAD filename.py   # Unstage file
git reset --soft HEAD~1      # Undo last commit, keep changes
git reset --hard HEAD~1      # Undo last commit, discard changes

# Stash changes
git stash                    # Save changes temporarily
git stash list               # List stashes
git stash pop                # Apply and remove latest stash
git stash apply              # Apply without removing
```

---

## 9. Practice Projects

### Project 1: First API Call
**Difficulty:** ⭐ Beginner

Create a simple script that makes a call to OpenAI's API.

```python
# first_api_call.py
import os
from dotenv import load_dotenv
import requests

load_dotenv()

def chat_with_gpt(prompt: str) -> str:
    """Send a prompt to GPT and get a response."""
    api_key = os.getenv("OPENAI_API_KEY")
    
    response = requests.post(
        "https://api.openai.com/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        },
        json={
            "model": "gpt-3.5-turbo",
            "messages": [{"role": "user", "content": prompt}]
        }
    )
    
    response.raise_for_status()
    return response.json()["choices"][0]["message"]["content"]

if __name__ == "__main__":
    response = chat_with_gpt("What is the meaning of life?")
    print(response)
```

### Project 2: CLI Chatbot
**Difficulty:** ⭐⭐ Beginner-Intermediate

Build an interactive command-line chatbot.

**Requirements:**
- [ ] Continuous conversation loop
- [ ] Maintain conversation history
- [ ] Handle 'exit' or 'quit' commands
- [ ] Display token usage
- [ ] Handle API errors gracefully

### Project 3: Text Summarizer
**Difficulty:** ⭐⭐ Intermediate

Create a tool that summarizes long texts.

**Requirements:**
- [ ] Accept text input from file or command line
- [ ] Handle texts longer than context window
- [ ] Configurable summary length
- [ ] Support different summary styles (brief, detailed, bullet points)

### Project 4: Code Explainer
**Difficulty:** ⭐⭐ Intermediate

Build a tool that explains code in plain English.

**Requirements:**
- [ ] Accept code input
- [ ] Detect programming language
- [ ] Explain what the code does
- [ ] Suggest improvements
- [ ] Handle multiple files

### Project 5: Async Batch Processor
**Difficulty:** ⭐⭐⭐ Intermediate-Advanced

Process multiple prompts concurrently.

**Requirements:**
- [ ] Read prompts from a file
- [ ] Process concurrently with rate limiting
- [ ] Save results to output file
- [ ] Progress indicator
- [ ] Error handling with retry logic
- [ ] Cost estimation

---

## 📅 Suggested Schedule

### Week 1-2: Python Fundamentals
| Day | Topics | Practice |
|-----|--------|----------|
| 1-2 | Variables, types, strings | Basic exercises |
| 3-4 | Control flow, loops | Logic problems |
| 5-6 | Functions, error handling | Write utility functions |
| 7-8 | Classes, OOP | Create data classes |
| 9-10 | Data structures | JSON processing |
| 11-14 | **Project:** First API Call | Build and test |

### Week 3-4: APIs and Async
| Day | Topics | Practice |
|-----|--------|----------|
| 1-3 | HTTP, requests library | API exploration |
| 4-6 | Error handling, retries | Robust API client |
| 7-9 | Async basics | Convert to async |
| 10-12 | Async patterns | Batch processing |
| 13-14 | **Project:** CLI Chatbot | Build interactive app |

### Week 5-6: AI Fundamentals
| Day | Topics | Practice |
|-----|--------|----------|
| 1-3 | AI/ML/DL concepts | Research and notes |
| 4-6 | LLM terminology | Explore APIs |
| 7-9 | Dev environment | Set up project |
| 10-12 | Git workflows | Practice commands |
| 13-14 | **Project:** Text Summarizer | Build tool |

---

## ✅ Phase 1 Completion Checklist

Before moving to Phase 2, ensure you can:

### Python
- [ ] Write functions with type hints
- [ ] Use list/dict comprehensions
- [ ] Handle exceptions properly
- [ ] Work with JSON data
- [ ] Create and use classes

### APIs
- [ ] Make GET and POST requests
- [ ] Handle API errors
- [ ] Implement retry logic
- [ ] Use environment variables for secrets

### Async
- [ ] Write async functions
- [ ] Use asyncio.gather for concurrency
- [ ] Implement rate limiting

### AI Concepts
- [ ] Explain the difference between AI, ML, DL, and LLM
- [ ] Understand tokens and context windows
- [ ] Know what temperature and top_p control
- [ ] Explain what RAG is

### Development
- [ ] Set up a Python project with virtual environment
- [ ] Use .env files for configuration
- [ ] Use Git for version control
- [ ] Structure a project properly

### Projects
- [ ] Complete at least 3 practice projects
- [ ] Make at least 10 successful API calls
- [ ] Push code to GitHub

---

## 🚀 Next Steps

Ready for Phase 2? Move on to:

**[Phase 2: LLMs and APIs →](../02-llms-and-apis/README.md)**

In Phase 2, you'll learn:
- Deep dive into LLM concepts
- OpenAI API in detail
- Prompt engineering techniques
- Working with multiple providers

---

## 📚 Additional Resources

### Python
- [Python Official Tutorial](https://docs.python.org/3/tutorial/)
- [Real Python](https://realpython.com/)
- [Automate the Boring Stuff](https://automatetheboringstuff.com/)

### APIs
- [Requests Documentation](https://requests.readthedocs.io/)
- [aiohttp Documentation](https://docs.aiohttp.org/)
- [REST API Tutorial](https://restfulapi.net/)

### AI Fundamentals
- [3Blue1Brown - Neural Networks](https://www.youtube.com/playlist?list=PLZHQObOWTQDNU6R1_67000Dx_ZCJB-3pi)
- [But what is a GPT?](https://www.youtube.com/watch?v=wjZofJX0v4M)
- [Intro to LLMs - Andrej Karpathy](https://www.youtube.com/watch?v=zjkBMFhNj_g)

---

**Happy Learning! 🐍**

*Estimated completion time: 4-6 weeks with daily practice*
