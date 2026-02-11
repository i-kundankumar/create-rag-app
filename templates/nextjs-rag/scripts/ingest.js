import "dotenv/config";
import { ingestDocuments } from "../src/lib/ingest.js";

/**
 * Script entry point for manual document ingestion.
 * Run this via `npm run ingest` to index all files in the ./documents folder.
 * 
 * Usage:
 *  npm run ingest
 * 
 * This script ensures that all documents in the local directory are 
 * processed, split, and embedded into the ChromaDB vector store.
 */
const run = async () => {
    try {
        console.log("🚀 Starting document ingestion process...");
        await ingestDocuments("./documents");
    } catch (error) {
        console.error("❌ Document ingestion failed:");
        console.error(error);
        process.exit(1);
    }
};

run();
