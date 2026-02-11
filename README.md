# Create RAG App

Scaffold a production-ready RAG (Retrieval Augmented Generation) application in seconds.

## Features

- 🚀 **Next.js & React**: Modern frontend with Tailwind setup.
- 🦜 **LangChain**: Best-in-class RAG pipeline.
- 🗄️ **ChromaDB**: Built-in local vector database.
- 🤖 **Multi-LLM Support**: Switch between OpenAI, Groq, and Ollama.
- 📄 **Document Ingestion**: Simple script to index PDFs and Text files.

## Usage

```bash
# Run directly with npx
npx create-rag-app my-ai-project

# Or install globally
npm install -g create-rag-app
create-rag-app my-ai-project
```

## Structure Result

The created app will have:

- `src/app`: User Interface (Chat)
- `src/lib`: RAG Utilities
- `scripts/ingest.js`: Document processor
- `documents/`: Folder to drop your knowledge base

## Development

```bash
# Clone the repo
git clone https://github.com/your-username/create-rag-app.git

# Install dependencies
npm install

# Test locally
npm link
create-rag-app test-project
```

## License

MIT
