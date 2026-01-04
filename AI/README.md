# AI Engineer Learning Roadmap

A comprehensive learning path from beginner to expert AI Engineer.

## 📋 Overview

This roadmap is designed to guide you through the journey of becoming an AI Engineer. It covers everything from foundational concepts to advanced topics like LLMs, RAG systems, AI agents, and production deployment.

**Total Duration:** 12-18 months  
**Career Outcome:** AI Engineer, ML Engineer, LLM Engineer, AI Solutions Architect

---

## 🤖 What is an AI Engineer?

An AI Engineer focuses on building applications and systems that leverage artificial intelligence, particularly Large Language Models (LLMs) and other pre-trained models. Unlike ML Engineers who train models from scratch, AI Engineers primarily work with existing models to create intelligent applications.

### AI Engineer vs ML Engineer

| Aspect | AI Engineer | ML Engineer |
|--------|-------------|-------------|
| **Focus** | Building AI-powered applications | Training and optimizing ML models |
| **Models** | Uses pre-trained models (GPT, Claude, etc.) | Builds custom models from scratch |
| **Skills** | API integration, prompt engineering, RAG | Mathematics, statistics, model architecture |
| **Tools** | LangChain, OpenAI API, vector databases | PyTorch, TensorFlow, scikit-learn |
| **Output** | AI products and features | Trained models and pipelines |

---

## 🗺️ Roadmap Phases

| Phase | Level | Duration | Focus Areas |
|-------|-------|----------|-------------|
| [Phase 1](./01-foundations/README.md) | Beginner | 1-2 months | Programming, AI fundamentals, terminology |
| [Phase 2](./02-llms-and-apis/README.md) | Beginner | 2-3 months | LLMs, OpenAI API, prompt engineering |
| [Phase 3](./03-embeddings-and-vectors/README.md) | Intermediate | 2-3 months | Embeddings, vector databases, RAG |
| [Phase 4](./04-ai-frameworks/README.md) | Intermediate | 2-3 months | LangChain, AI agents, orchestration |
| [Phase 5](./05-advanced-topics/README.md) | Advanced | 2-3 months | Fine-tuning, evaluation, optimization |
| [Phase 6](./06-production/README.md) | Expert | 2-3 months | Deployment, scaling, MLOps |

---

## 🎯 Learning Path Visualization

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           AI ENGINEER ROADMAP                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Phase 1: Foundations ──────► Phase 2: LLMs & APIs ──────► Phase 3: RAG         │
│  ┌──────────────────┐         ┌──────────────────┐         ┌──────────────────┐ │
│  │ • Python         │         │ • LLM Concepts   │         │ • Embeddings     │ │
│  │ • AI Terminology │         │ • OpenAI API     │         │ • Vector DBs     │ │
│  │ • Dev Environment│         │ • Prompt Eng.    │         │ • RAG Systems    │ │
│  │ • Git Basics     │         │ • Other Models   │         │ • Chunking       │ │
│  └──────────────────┘         └──────────────────┘         └──────────────────┘ │
│           │                           │                            │             │
│           ▼                           ▼                            ▼             │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                        Phase 4: AI Frameworks                               │ │
│  │  • LangChain  • LlamaIndex  • AI Agents  • Tool Calling  • Orchestration   │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                       │                                          │
│                                       ▼                                          │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                       Phase 5: Advanced Topics                              │ │
│  │  • Fine-tuning  • Evaluation  • AI Safety  • Multimodal  • Optimization    │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                       │                                          │
│                                       ▼                                          │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                        Phase 6: Production                                  │ │
│  │  • Deployment  • Scaling  • Monitoring  • Cost Optimization  • MLOps       │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📊 Skills Matrix

### Core Skills by Phase

| Skill | Phase 1 | Phase 2 | Phase 3 | Phase 4 | Phase 5 | Phase 6 |
|-------|---------|---------|---------|---------|---------|---------|
| Python Programming | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| LLM Understanding | ⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Prompt Engineering | - | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| API Integration | ⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Vector Databases | - | ⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| RAG Systems | - | - | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| AI Agents | - | - | - | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Production/MLOps | - | - | - | ⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

---

## 🛠️ Technology Stack

### LLM Providers

| Provider | Models | Best For |
|----------|--------|----------|
| **OpenAI** | GPT-4, GPT-4o, GPT-3.5 | General purpose, code, reasoning |
| **Anthropic** | Claude 3.5, Claude 3 | Long context, safety, analysis |
| **Google** | Gemini Pro, Gemini Ultra | Multimodal, Google integration |
| **Meta** | Llama 3, Llama 2 | Open-source, self-hosting |
| **Mistral** | Mistral Large, Mixtral | Efficient, open-weight |
| **Cohere** | Command R+, Embed | Enterprise, RAG |

### Vector Databases

| Database | Type | Best For |
|----------|------|----------|
| **Pinecone** | Managed | Production, scalability |
| **Weaviate** | Open-source | Hybrid search, GraphQL |
| **Chroma** | Open-source | Local development, prototyping |
| **Qdrant** | Open-source | High performance, filtering |
| **Milvus** | Open-source | Large-scale, enterprise |
| **pgvector** | Extension | PostgreSQL integration |

### Frameworks & Tools

| Category | Tools |
|----------|-------|
| **Orchestration** | LangChain, LlamaIndex, Haystack |
| **Agents** | AutoGPT, CrewAI, Microsoft AutoGen |
| **Evaluation** | Ragas, LangSmith, Weights & Biases |
| **Deployment** | FastAPI, Modal, Replicate, AWS Bedrock |
| **Monitoring** | LangFuse, Helicone, Portkey |

---

## 📚 Curriculum Overview

### Phase 1: Foundations (1-2 months)

```
├── Programming Fundamentals
│   ├── Python basics
│   ├── Data structures
│   ├── APIs and HTTP
│   └── Async programming
├── AI Fundamentals
│   ├── What is AI/ML/DL?
│   ├── AI vs AGI
│   ├── Common terminology
│   └── AI ethics basics
└── Development Environment
    ├── IDE setup
    ├── Git version control
    └── Virtual environments
```

### Phase 2: LLMs and APIs (2-3 months)

```
├── LLM Concepts
│   ├── How LLMs work
│   ├── Training vs Inference
│   ├── Tokens and context
│   └── Model capabilities
├── OpenAI Platform
│   ├── API authentication
│   ├── Chat completions
│   ├── Function calling
│   └── Token management
├── Prompt Engineering
│   ├── Prompt structure
│   ├── Few-shot learning
│   ├── Chain-of-thought
│   └── System prompts
└── Other Providers
    ├── Anthropic Claude
    ├── Google Gemini
    └── Open-source models
```

### Phase 3: Embeddings & Vector Search (2-3 months)

```
├── Embeddings
│   ├── What are embeddings?
│   ├── Text embeddings
│   ├── Embedding models
│   └── Similarity search
├── Vector Databases
│   ├── Vector DB concepts
│   ├── Pinecone
│   ├── Chroma
│   └── Weaviate
└── RAG (Retrieval Augmented Generation)
    ├── RAG architecture
    ├── Document loading
    ├── Chunking strategies
    ├── Retrieval methods
    └── Response generation
```

### Phase 4: AI Frameworks (2-3 months)

```
├── LangChain
│   ├── Chains and runnables
│   ├── Memory management
│   ├── Output parsers
│   └── LCEL (LangChain Expression Language)
├── AI Agents
│   ├── Agent concepts
│   ├── Tool calling
│   ├── ReAct pattern
│   └── Multi-agent systems
└── Orchestration
    ├── Workflow design
    ├── Error handling
    ├── Fallback strategies
    └── Observability
```

### Phase 5: Advanced Topics (2-3 months)

```
├── Fine-tuning
│   ├── When to fine-tune
│   ├── Data preparation
│   ├── OpenAI fine-tuning
│   └── Open-source fine-tuning
├── Evaluation
│   ├── LLM evaluation metrics
│   ├── RAG evaluation
│   ├── Human evaluation
│   └── Automated testing
├── AI Safety & Ethics
│   ├── Prompt injection
│   ├── Bias and fairness
│   ├── Content moderation
│   └── Privacy concerns
└── Multimodal AI
    ├── Vision models
    ├── Audio/speech
    └── Image generation
```

### Phase 6: Production (2-3 months)

```
├── Deployment
│   ├── API design
│   ├── Containerization
│   ├── Cloud deployment
│   └── Serverless options
├── Scaling
│   ├── Load balancing
│   ├── Caching strategies
│   ├── Rate limiting
│   └── Queue management
├── Monitoring & Observability
│   ├── Logging
│   ├── Metrics
│   ├── Tracing
│   └── Alerting
└── Cost Optimization
    ├── Token optimization
    ├── Model selection
    ├── Caching
    └── Batch processing
```

---

## 🎮 Projects Portfolio

Build these projects as you progress:

### Beginner Projects
- [ ] **CLI Chatbot** - Simple terminal-based chatbot using OpenAI API
- [ ] **Text Summarizer** - Summarize articles and documents
- [ ] **Code Explainer** - Explain code snippets in plain English
- [ ] **Prompt Library** - Build a collection of effective prompts

### Intermediate Projects
- [ ] **Document Q&A** - RAG system for querying PDF documents
- [ ] **Semantic Search** - Build a semantic search engine
- [ ] **AI Writing Assistant** - Content generation with style control
- [ ] **Chatbot with Memory** - Conversational AI with context retention

### Advanced Projects
- [ ] **Multi-Agent System** - Collaborative AI agents for complex tasks
- [ ] **Custom RAG Pipeline** - Production-ready RAG with evaluation
- [ ] **AI-Powered API** - REST API with AI capabilities
- [ ] **Fine-tuned Model** - Custom model for specific use case

### Expert Projects
- [ ] **Enterprise AI Platform** - Full-stack AI application
- [ ] **AI Agent Marketplace** - Platform for deploying AI agents
- [ ] **Open-Source Contribution** - Contribute to AI frameworks
- [ ] **Research Implementation** - Implement recent AI papers

---

## 📈 Career Progression

```
Junior AI Engineer (0-2 years)
        │
        ├── Skills: API integration, basic RAG, prompt engineering
        │
        ▼
Mid-level AI Engineer (2-4 years)
        │
        ├── Skills: Complex RAG, agents, fine-tuning, evaluation
        │
        ▼
Senior AI Engineer (4-6 years)
        │
        ├── Skills: Architecture, optimization, team leadership
        │
        ├──────────────────────────────────────────┐
        │                                          │
        ▼                                          ▼
Staff AI Engineer                        AI Solutions Architect
        │                                          │
        ▼                                          ▼
Principal Engineer                       Head of AI / AI Director
```

---

## 📚 Learning Resources

### Free Resources

| Resource | Type | Topics |
|----------|------|--------|
| [DeepLearning.AI Short Courses](https://www.deeplearning.ai/short-courses/) | Courses | LangChain, RAG, Agents |
| [OpenAI Cookbook](https://cookbook.openai.com/) | Examples | API usage, best practices |
| [LangChain Documentation](https://python.langchain.com/) | Docs | Framework guide |
| [Hugging Face Course](https://huggingface.co/learn) | Course | Transformers, NLP |
| [Prompt Engineering Guide](https://www.promptingguide.ai/) | Guide | Prompt techniques |
| [LLM University by Cohere](https://cohere.com/llmu) | Course | LLM fundamentals |

### Paid Resources

| Resource | Type | Topics |
|----------|------|--------|
| [Scrimba AI Engineer Path](https://scrimba.com/learn/aiengineer) | Course | Full AI Engineer curriculum |
| [Full Stack LLM Bootcamp](https://fullstackdeeplearning.com/) | Bootcamp | Production LLM apps |
| [Building LLM Apps (Manning)](https://www.manning.com/) | Book | End-to-end development |
| [AI Engineering (O'Reilly)](https://www.oreilly.com/) | Book | Comprehensive guide |

### Communities

- [r/LocalLLaMA](https://reddit.com/r/LocalLLaMA) - Open-source LLM community
- [r/MachineLearning](https://reddit.com/r/MachineLearning) - ML research and news
- [Hugging Face Discord](https://huggingface.co/join/discord) - AI/ML community
- [LangChain Discord](https://discord.gg/langchain) - LangChain community

---

## 🔧 Development Environment

### Required Tools

```
Core:
├── Python 3.10+
├── VS Code / PyCharm
├── Git
└── Docker

Package Management:
├── pip / uv
├── conda (optional)
└── poetry (optional)

APIs:
├── OpenAI API key
├── Anthropic API key (optional)
└── Hugging Face token
```

### Recommended VS Code Extensions

```
- Python
- Pylance
- Jupyter
- GitHub Copilot
- REST Client
- Docker
- GitLens
```

---

## ✅ How to Use This Roadmap

1. **Start from Phase 1** - Even if you know Python, review AI fundamentals
2. **Build projects** - Apply each concept with hands-on projects
3. **Get API access** - Sign up for OpenAI and other providers early
4. **Join communities** - Learn from others and share your progress
5. **Stay updated** - AI moves fast, follow latest developments
6. **Document learning** - Keep notes and build a portfolio

---

## 📝 Progress Tracker

Track your overall progress:

- [ ] Phase 1: Foundations completed
- [ ] Phase 2: LLMs and APIs completed
- [ ] Phase 3: Embeddings and RAG completed
- [ ] Phase 4: AI Frameworks completed
- [ ] Phase 5: Advanced Topics completed
- [ ] Phase 6: Production completed
- [ ] Portfolio: 5+ projects completed
- [ ] Deployed: 2+ projects in production

---

## 🌟 Key Differentiators

What makes a great AI Engineer:

1. **Prompt Engineering Mastery** - Get the best outputs from LLMs
2. **System Design** - Architect scalable AI systems
3. **Evaluation Skills** - Measure and improve AI quality
4. **Cost Awareness** - Optimize for performance and cost
5. **Safety First** - Build responsible AI applications
6. **Staying Current** - Keep up with rapid AI advances

---

## 🚀 Getting Started

Ready to begin? Start with Phase 1:

**[Phase 1: Foundations →](./01-foundations/README.md)**

---

**Happy Learning! 🤖**

*Last updated: January 2026*

---

## 📖 References

- [roadmap.sh/ai-engineer](https://roadmap.sh/ai-engineer) - Original roadmap inspiration
- [OpenAI Documentation](https://platform.openai.com/docs)
- [Anthropic Documentation](https://docs.anthropic.com/)
- [LangChain Documentation](https://python.langchain.com/docs/)
