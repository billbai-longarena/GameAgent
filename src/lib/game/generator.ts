import { TemplateManifest } from '@/types/template';
import { GameType, Project } from '@/types/project'; // Assuming GameType and Project are defined
import { File as ProjectFile, FileType } from '@/types/file';
import { ExecutionEngine } from '@/lib/agent/execution'; // AI service for more complex generation
// import { FileService } from '@/services/file.service'; // To save generated files
import * as fs from 'fs';
import * as path from 'path';

// Placeholder for game requirements, to be defined based on user input and AI analysis
export interface GameRequirements {
    title: string;
    description?: string;
    theme?: string;
    // Specific game type requirements, e.g., for quiz:
    questions?: Array<{
        text: string;
        options: string[];
        correctAnswer: string | number;
    }>;
    // For matching:
    pairs?: Array<{ item1: string; item2: string }>;
    // For sorting:
    sortableItems?: Array<{ id: string; text: string; correctOrder: number }>;
    // Add other game-specific requirements as needed
}

// Placeholder for customizations based on AI interpretation or user fine-tuning
export interface Customizations {
    // e.g., specific color schemes, difficulty levels, number of items
    difficulty?: 'easy' | 'medium' | 'hard';
    itemCount?: number;
}

// Represents the generated game code and assets
export interface GeneratedGame {
    projectId: string;
    gameId: string; // A unique ID for this generated game instance
    baseTemplateId: string;
    files: ProjectFile[]; // List of generated/modified files (HTML, CSS, JS, JSON config)
    previewUrl?: string; // URL to preview this specific game instance
}

export class GameGenerator {
    // private aiService: AIService;
    // private fileService: FileService; // Replaced by executionEngine
    private executionEngine: ExecutionEngine;
    private availableTemplates: TemplateManifest[];

    constructor(
        // aiService: AIService,
        // fileService: FileService, // Replaced by executionEngine
        executionEngine: ExecutionEngine,
        availableTemplates: TemplateManifest[] = [] // Templates loaded at startup
    ) {
        // this.aiService = aiService;
        this.executionEngine = executionEngine;
        this.availableTemplates = availableTemplates;
        console.log("GameGenerator initialized with templates:", this.availableTemplates.map(t => t.id).join(', '));
    }

    /**
     * Selects the most appropriate template based on the game type and requirements.
     * This is a simplified version. AI could be used for more nuanced selection.
     */
    public selectTemplate(gameType: GameType, requirements: GameRequirements): TemplateManifest | null {
        // Simple matching for now, e.g., gameType 'quiz' matches template with id 'quiz-template'
        // In a real scenario, this could involve matching tags, analyzing descriptions, etc.
        const selected = this.availableTemplates.find(template => template.id.startsWith(gameType));
        if (!selected) {
            console.warn(`No template found for game type: ${gameType}`);
            // Fallback or error handling
            return this.availableTemplates.length > 0 ? this.availableTemplates[0] : null;
        }
        console.log(`Selected template "${selected.name}" for game type "${gameType}"`);
        return selected;
    }

    /**
     * Generates the game files based on a selected template, user requirements, and customizations.
     * This is a placeholder for the core game generation logic.
     * In a real implementation, this would involve:
     * 1. Fetching the template files (HTML, CSS, JS).
     * 2. Using AI to understand `requirements` and `customizations`.
     * 3. Modifying the template's JS to inject dynamic content (e.g., questions for a quiz from `requirements`).
     * 4. Generating a new JSON configuration file (e.g., `questions.json`) based on `requirements`.
     * 5. Potentially modifying CSS based on `customizations.theme`.
     * 6. Saving these new/modified files to a project-specific directory.
     */
    public async generateGame(
        project: Project,
        gameType: GameType,
        requirements: GameRequirements,
        customizations?: Customizations
    ): Promise<GeneratedGame | null> {
        console.log(`Generating game for project ${project.id}, type: ${gameType}`);
        const template = this.selectTemplate(gameType, requirements);
        if (!template) {
            console.error('Could not select a template for game generation.');
            return null;
        }

        const gameId = `game-${Date.now()}`; // Unique ID for this game instance
        const gameFiles: ProjectFile[] = [];
        const gameBasePath = `generated_games/${project.id}/${gameId}`;

        // The availableTemplates list is now corrected at the source (control/route.ts)
        // So, 'template' object here should always correspond to an existing template directory.
        const templateDir = path.join(process.cwd(), 'gagent', 'public', 'templates', template.id);

        const htmlFileName = template.entryPoint.split('/').pop() || 'index.html';
        const cssFileName = 'style.css'; // Assuming standard names from templates
        const scriptFileName = 'script.js'; // Assuming standard names from templates
        const configFileName = `${gameType}_config.json`;

        let htmlContent = `<!-- Error: Could not load template HTML for ${template.name} -->`;
        try {
            const templateHtmlPath = path.join(templateDir, htmlFileName);
            if (fs.existsSync(templateHtmlPath)) {
                htmlContent = fs.readFileSync(templateHtmlPath, 'utf-8');
                // Basic customization: Replace title
                htmlContent = htmlContent.replace(/<title>.*<\/title>/, `<title>${requirements.title || template.name}</title>`);
            } else {
                console.error(`Template HTML file not found: ${templateHtmlPath}. Using error placeholder.`);
                // No fallback to other templates here, as selectTemplate should have returned null if template was invalid.
            }
        } catch (e) {
            console.error(`Error reading template HTML ${path.join(templateDir, htmlFileName)}:`, e);
        }

        gameFiles.push({
            id: `${gameId}-html`,
            projectId: project.id,
            name: htmlFileName,
            path: `${gameBasePath}/${htmlFileName}`,
            type: FileType.SOURCE_CODE,
            content: htmlContent,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });

        let cssContent = `/* Fallback CSS for ${template.name} */`;
        try {
            const templateCssPath = path.join(templateDir, cssFileName);
            if (fs.existsSync(templateCssPath)) {
                cssContent = fs.readFileSync(templateCssPath, 'utf-8');
            } else {
                console.warn(`Template CSS file not found: ${templateCssPath}. Using fallback content.`);
            }
        } catch (e) {
            console.error(`Error reading template CSS ${path.join(templateDir, cssFileName)}:`, e);
        }

        gameFiles.push({
            id: `${gameId}-css`,
            projectId: project.id,
            name: cssFileName,
            path: `${gameBasePath}/${cssFileName}`,
            type: FileType.STYLE,
            content: cssContent,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });

        let scriptContent = `// Fallback JS for ${template.name}`;
        try {
            const templateScriptPath = path.join(templateDir, scriptFileName);
            if (fs.existsSync(templateScriptPath)) {
                scriptContent = fs.readFileSync(templateScriptPath, 'utf-8');
            } else {
                console.warn(`Template JS file not found: ${templateScriptPath}. Using fallback content.`);
            }
        } catch (e) {
            console.error(`Error reading template JS ${path.join(templateDir, scriptFileName)}:`, e);
        }

        gameFiles.push({
            id: `${gameId}-js`,
            projectId: project.id,
            name: scriptFileName,
            path: `${gameBasePath}/${scriptFileName}`,
            type: FileType.SOURCE_CODE,
            content: scriptContent,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });

        let configContent = {};
        if (gameType === GameType.QUIZ && requirements.questions) {
            configContent = { title: requirements.title, instruction: requirements.description, questions: requirements.questions };
        } else if (gameType === GameType.MATCHING && requirements.pairs) {
            configContent = { title: requirements.title, instruction: requirements.description, items: requirements.pairs.map((p, i) => ({ id: `pair${i}`, term: p.item1, definition: p.item2 })) };
        } else if (gameType === GameType.SORTING && requirements.sortableItems) {
            configContent = { title: requirements.title, instruction: requirements.description, items: requirements.sortableItems };
        }
        // Add more game types as needed

        gameFiles.push({
            id: `${gameId}-config`,
            projectId: project.id,
            name: configFileName,
            path: `${gameBasePath}/${configFileName}`,
            type: FileType.CONFIG,
            content: JSON.stringify(configContent, null, 2),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });

        // Add conceptual entry for preview image if defined in template
        if (template.previewImageUrl) {
            const previewImageFileName = template.previewImageUrl.split('/').pop() || 'preview.png';
            const templatePreviewImagePath = path.join(templateDir, previewImageFileName);
            let previewImageContent = `Placeholder for preview image: ${template.previewImageUrl}`;

            if (fs.existsSync(templatePreviewImagePath)) {
                previewImageContent = `[Reference to template image: ${template.id}/${previewImageFileName}]`;
            } else {
                console.warn(`Template preview image file not found: ${templatePreviewImagePath}`);
            }

            gameFiles.push({
                id: `${gameId}-preview-img`,
                projectId: project.id,
                name: previewImageFileName,
                path: `${gameBasePath}/${previewImageFileName}`,
                type: FileType.ASSET,
                content: previewImageContent, // Placeholder, actual binary copy needed
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            });
        }

        try {
            for (const file of gameFiles) {
                await this.executionEngine.createFile(`public/${file.path}`, file.content || '', file.type);
            }
            console.log(`Files created successfully via ExecutionEngine in public/${gameBasePath}`);
        } catch (error) {
            console.error(`Error creating files via ExecutionEngine:`, error);
        }

        const generatedGame: GeneratedGame = {
            projectId: project.id,
            gameId,
            baseTemplateId: template.id,
            files: gameFiles,
            previewUrl: `/${gameBasePath}/${htmlFileName}`,
        };

        console.log(`Game "${requirements.title}" (using template: ${template.id}) generated successfully:`, generatedGame);
        return generatedGame;
    }

    // Placeholder for more advanced AI-driven content/logic generation
    // private async generateDynamicContent(template: TemplateManifest, requirements: GameRequirements): Promise<string> {
    //   const prompt = `Based on the template "${template.name}" and the following requirements: ${JSON.stringify(requirements)}, generate the necessary data or script modifications.`;
    //   const result = await this.aiService.generateText(prompt);
    //   return result.text;
    // }
}
