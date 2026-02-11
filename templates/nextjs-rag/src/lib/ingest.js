import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { OpenAIEmbeddings } from "@langchain/openai";
import path from "path";

/**
 * Sanitizes metadata values to ensure they are compatible with vector database storage (e.g., ChromaDB).
 * Vector stores often only support string, number, or boolean values for metadata.
 * 
 * @param {Object} metadata - The original metadata object.
 * @returns {Object} - The clean metadata object.
 */
function cleanMetadata(metadata = {}) {
    const clean = {};

    for (const [key, value] of Object.entries(metadata)) {
        if (
            typeof value === "string" ||
            typeof value === "number" ||
            typeof value === "boolean" ||
            value === null
        ) {
            clean[key] = value;
        } else {
            // Convert complex objects/arrays to strings to prevent DB injection errors
            clean[key] = JSON.stringify(value);
        }
    }

    return clean;
}

/**
 * Ingests documents into the vector database.
 * Supports loading from a directory or a specific single file.
 * 
 * @param {string} source - The path to the document directory or single file.
 * @param {boolean} isSingleFile - Flag to indicate if the source is a single file path.
 * @returns {Promise<Object>} - Result object indicating success/failure and chunk count.
 */
export async function ingestDocuments(source = "./documents", isSingleFile = false) {
    try {
        const absoluteSource = path.resolve(process.cwd(), source);
        let loader;

        // Determine the Loader Strategy
        if (isSingleFile) {
            const ext = path.extname(source).toLowerCase();
            if (ext === ".pdf") {
                loader = new PDFLoader(absoluteSource);
            } else if (ext === ".txt") {
                loader = new TextLoader(absoluteSource);
            } else {
                throw new Error(`Unsupported file extension: ${ext}`);
            }
            console.log(`📥 Loading document: ${source}...`);
        } else {
            // Load entire directory
            const absoluteDocsDir = path.resolve(process.cwd(), source);
            loader = new DirectoryLoader(absoluteDocsDir, {
                ".txt": (filePath) => new TextLoader(filePath),
                ".pdf": (filePath) => new PDFLoader(filePath)
            });
            console.log(`📥 Loading documents from ${source}...`);
        }

        const docs = await loader.load();

        if (docs.length === 0) {
            console.log("⚠ No documents found.");
            return { success: false, message: "No documents found." };
        }

        // Split text into manageable chunks for the LLM context window
        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200
        });

        console.log("✂ Splitting documents...");
        const splitDocs = await splitter.splitDocuments(docs);

        // Clean metadata to avoid database errors
        const cleanDocs = splitDocs.map((doc) => ({
            ...doc,
            metadata: cleanMetadata(doc.metadata),
        }));

        console.log(`✅ Split into ${splitDocs.length} chunks.`);
        console.log("📌 Generating embeddings and storing in Chroma...");

        // Initialize Embeddings Provider
        const provider = process.env.LLM_PROVIDER || "openai";
        let embeddings;

        if (provider === "gemini") {
            embeddings = new GoogleGenerativeAIEmbeddings({
                apiKey: process.env.GOOGLE_API_KEY,
                modelName: "gemini-embedding-001"
            });
        } else {
            embeddings = new OpenAIEmbeddings({
                apiKey: process.env.OPENAI_API_KEY
            });
        }

        // Store vectors in ChromaDB
        await Chroma.fromDocuments(cleanDocs, embeddings, {
            collectionName: process.env.COLLECTION_NAME || "rag-docs",
            url: process.env.CHROMA_URL || "http://localhost:8000"
        });

        console.log("🎉 ✅ Ingestion Complete!");
        return { success: true, chunks: splitDocs.length };
    } catch (error) {
        console.error("❌ Ingestion Failed:", error);
        throw error;
    }
}
