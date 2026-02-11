import path from "path";
import fs from "fs-extra";
import chalk from "chalk";
import { Command } from "commander";
import { getOptions } from "./prompts.js";
import { checkDir, copyTemplate, installDependencies } from "./utils.js";

const packageJson = JSON.parse(
    await fs.readFile(new URL("../package.json", import.meta.url))
);

export async function main() {
    console.log(chalk.bold.cyan("\n🚀 Welcome to Create RAG App!\n"));

    let projectName;

    const program = new Command(packageJson.name)
        .version(packageJson.version)
        .arguments('[project-directory]')
        .usage(`${chalk.green('[project-directory]')} [options]`)
        .action((name) => {
            projectName = name;
        })
        .parse(process.argv);

    const options = await getOptions(projectName);
    const projectPath = path.resolve(process.cwd(), options.projectName);

    console.log(`\nCreating a new RAG app in: ${chalk.green(projectPath)}\n`);

    // Ensure directory doesn't exist
    checkDir(projectPath);

    // Copy template
    // We need to map the template option to a folder name
    // The 'value' in prompts.js choices is 'nextjs-rag', so ensure that folder exists in templates/
    const templateName = options.template;
    await copyTemplate(templateName, projectPath);

    // Configure Environment Variables
    const envExamplePath = path.join(projectPath, ".env.example");
    const envPath = path.join(projectPath, ".env");

    if (await fs.pathExists(envExamplePath)) {
        await fs.copy(envExamplePath, envPath);
        console.log(chalk.green("✔ Created .env file from example"));

        // Inject selected provider config
        let envContent = await fs.readFile(envPath, "utf-8");
        envContent += `\n# Auto-generated config\n`;
        envContent += `LLM_PROVIDER=${options.provider}\n`;
        envContent += `VECTOR_DB=${options.vectorDb}\n`;
        await fs.writeFile(envPath, envContent);
    }

    // Install Dependencies (user requested automatic installation)
    await installDependencies(projectPath);

    // Final Success Message
    console.log(chalk.bold.green("\n🎉 Success! Your RAG app is ready."));
    console.log(chalk.yellow("\nNext steps:"));
    console.log(chalk.cyan(`  cd ${options.projectName}`));
    console.log(chalk.cyan(`  npm run dev`));
    console.log("");
}
