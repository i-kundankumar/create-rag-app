
import fs from "fs-extra";
import path from "path";
import chalk from "chalk";
import { exec } from "child_process";
import util from "util";
import ora from "ora";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const execAsync = util.promisify(exec);

export function checkDir(targetPath) {
    if (fs.existsSync(targetPath)) {
        console.error(chalk.red(`\n❌ Error: Directory ${path.basename(targetPath)} already exists.`));
        process.exit(1);
    }
}

export async function copyTemplate(templateName, targetPath) {
    const spinner = ora("Copying project files...").start();

    // Assuming templates live in ../templates relative to this file
    const templateDir = path.resolve(__dirname, "../templates", templateName);

    if (!fs.existsSync(templateDir)) {
        spinner.fail(chalk.red(`Template ${templateName} not found at ${templateDir}`));
        process.exit(1);
    }

    try {
        await fs.copy(templateDir, targetPath);
        spinner.succeed(chalk.green("Project files created successfully."));
    } catch (err) {
        spinner.fail(chalk.red("Failed to copy files."));
        console.error(err);
        process.exit(1);
    }
}

export async function installDependencies(targetPath) {
    const spinner = ora("Installing dependencies... This might take a moment.").start();

    try {
        // Run npm install in the new directory
        await execAsync("npm install", { cwd: targetPath });
        spinner.succeed(chalk.green("Dependencies installed via npm."));
    } catch (err) {
        // Fallback for peer dependency conflicts common in AI libraries
        try {
            spinner.text = "Retrying with --legacy-peer-deps...";
            await execAsync("npm install --legacy-peer-deps", { cwd: targetPath });
            spinner.succeed(chalk.green("Dependencies installed with legacy peer deps."));
        } catch (retryErr) {
            spinner.fail(chalk.red("Failed to install dependencies."));
            console.log(chalk.yellow("You can try installing manually:"));
            console.log(chalk.cyan(`  cd ${path.basename(targetPath)}`));
            console.log(chalk.cyan("  npm install --legacy-peer-deps"));
        }
    }
}
