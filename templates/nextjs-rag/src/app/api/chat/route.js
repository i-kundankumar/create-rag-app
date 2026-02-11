import { getLLM, getEmbeddings } from "@/lib/llm";
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { PromptTemplate } from "@langchain/core/prompts";

export async function POST(req) {
    try {
        const body = await req.json();
        const message = body?.message;

        if (!message || typeof message !== "string") {
            return Response.json(
                { error: "Invalid request. 'message' must be a string." },
                { status: 400 }
            );
        }

        const vectorStore = await Chroma.fromExistingCollection(getEmbeddings(), {
            collectionName: process.env.COLLECTION_NAME || "rag-docs",
            url: process.env.CHROMA_URL || "http://localhost:8000"
        });

        const retriever = vectorStore.asRetriever();
        const llm = getLLM();

        // 🔥 manually retrieve documents
        const docs = await retriever.invoke(message);

        const context = docs.map((doc) => doc.pageContent).join("\n\n");

        const prompt = PromptTemplate.fromTemplate(`
Answer the question based only on the following context:

{context}

Question: {question}
`);

        const formattedPrompt = await prompt.format({
            context,
            question: message
        });

        const result = await llm.invoke(formattedPrompt);

        return Response.json({
            response: result.content
        });
    } catch (error) {
        console.error(error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}
