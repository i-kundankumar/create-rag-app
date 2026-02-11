import { NextResponse } from "next/server";
import { ingestDocuments } from "@/lib/ingest";
import fs from "fs/promises";
import path from "path";

/**
 * Handle document uploads and immediate ingestion into ChromaDB.
 * This route accepts a file upload, saves it locally, and triggers the vector store ingestion.
 * 
 * @param {Request} req 
 * @returns {NextResponse}
 */
export async function POST(req) {
    try {
        const formData = await req.formData();
        const file = formData.get("file");

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        // Validate file type (basic)
        const allowedExtensions = [".pdf", ".txt"];
        const ext = path.extname(file.name).toLowerCase();
        if (!allowedExtensions.includes(ext)) {
            return NextResponse.json({ error: "Unsupported file type. Only PDF and TXT are allowed." }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const uploadDir = path.resolve(process.cwd(), "documents");

        // Ensure the upload directory exists
        try {
            await fs.mkdir(uploadDir, { recursive: true });
        } catch (e) {
            // Directory likely already exists
        }

        const filePath = path.join(uploadDir, file.name);
        await fs.writeFile(filePath, buffer);

        // Run ingestion for this specific file
        console.log(`Starting ingestion for: ${file.name}`);
        await ingestDocuments(`documents/${file.name}`, true);

        return NextResponse.json({ success: true, message: "File uploaded and ingested successfully." });
    } catch (error) {
        console.error("Upload/Ingest Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
