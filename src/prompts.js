
import inquirer from "inquirer";

export async function getOptions(initialProjectName) {
    let questions = [
        {
            type: "input",
            name: "projectName",
            message: "What is your project named?",
            default: "my-rag-app",
            validate: (input) => {
                if (/^([a-z0-9\-\_\.]+)$/.test(input)) return true;
                return "Project name may only include letters, numbers, dashes, and underscores.";
            },
        },
        {
            type: "list",
            name: "template",
            message: "Which template would you like to use?",
            choices: [
                { name: "Next.js + LangChain + ChromaDB (Recommended)", value: "nextjs-rag" },
                { name: "Express API + PDF Processor (Backend Only)", value: "express-rag" }, // Future scope
            ],
            default: "nextjs-rag",
        },
        {
            type: "list",
            name: "provider",
            message: "Which LLM provider do you want configured?",
            choices: [
                { name: "OpenAI (GPT-4o, GPT-3.5)", value: "openai" },
                { name: "Groq (Llama 3, Mixtral - Fast!)", value: "groq" },
                { name: "Ollama (Local Models)", value: "ollama" },
                { name: "Gemini (Google DeepMind)", value: "gemini" },
            ],
            default: "openai",
        },
        {
            type: "list",
            name: "vectorDb",
            message: "Which Vector Database do you want to use?",
            choices: [
                { name: "ChromaDB (Local)", value: "chroma" },
                { name: "Supabase pgvector (Cloud)", value: "supabase" },
            ],
            default: "chroma",
        },
    ];

    if (initialProjectName) {
        if (/^([a-z0-9\-\_\.]+)$/.test(initialProjectName)) {
            // Valid project name provided via CLI, skip the prompt
            questions = questions.filter(q => q.name !== "projectName");
        } else {
            console.log("⚠ Invalid project name provided via CLI.");
            initialProjectName = null; // Force prompt
        }
    }

    const answers = await inquirer.prompt(questions);

    return {
        projectName: initialProjectName || answers.projectName,
        ...answers
    };
}
