// import { FileService } from './file.service'; // May be needed later
// import { Project } from '@/types/project'; // May be needed later
// import { GeneratedGame } from '@/lib/game/generator'; // May be needed later

/**
 * Service responsible for managing and providing game previews.
 *
 * In the current simplified implementation, preview URLs are often directly constructed
 * to point to files within the /public directory (e.g., for templates or conceptually
 * for generated games if they were placed there).
 *
 * A more advanced PreviewService might handle:
 * - Dynamic generation or serving of preview files if they are not static.
 * - Managing temporary preview environments.
 * - Authentication/authorization for previews.
 * - Integration with a build system if previews need to be compiled.
 */
export class PreviewService {
    // private fileService: FileService;

    constructor(/* fileService: FileService */) {
        // this.fileService = fileService;
        console.log('PreviewService initialized.');
    }

    /**
     * Gets the URL for previewing a specific game instance or template.
     *
     * @param projectId The ID of the project.
     * @param gameId The ID of the specific game instance (if applicable).
     * @param entryPoint The entry HTML file for the game/template.
     * @returns A string URL for the preview, or null if not found.
     */
    public getPreviewUrl(projectId: string, gameIdOrTemplateId: string, entryPoint: string): string | null {
        // This is a simplified example.
        // For templates, the URL might be directly like /templates/{templateId}/{entryPoint}
        // For generated games, it might be /generated_games/{projectId}/{gameId}/{entryPoint}
        // This service could construct these URLs or look them up from a manifest/database.

        // Example for a template (assuming entryPoint is relative to template root):
        // 修改匹配逻辑，确保只有确切匹配"quiz-template"或"matching-game-template"这样的模板ID
        const knownTemplates = ['quiz-template', 'matching-game-template'];
        if (knownTemplates.includes(gameIdOrTemplateId)) { // 更精确的检查
            const templateUrl = `/templates/${gameIdOrTemplateId.replace('-template', '')}/${entryPoint}`;
            console.log(`PreviewService: Generated template URL: ${templateUrl}`);
            return templateUrl;
        }

        // Example for a generated game (conceptual, assumes files are served from such a path)
        const generatedGameUrl = `/generated_games/${projectId}/${gameIdOrTemplateId}/${entryPoint}`;
        console.log(`PreviewService: Generated game instance URL: ${generatedGameUrl}`);
        // In a real app, you'd verify if these files actually exist or are servable.
        return generatedGameUrl;
    }

    /**
     * Prepares a game for preview. This might involve copying files,
     * starting a temporary server, or other setup steps.
     * (Placeholder for more complex scenarios)
     *
     * @param projectId The project ID.
     * @param gameData The generated game data.
     * @returns Promise<string | null> The URL for the prepared preview.
     */
    public async prepareGamePreview(
        projectId: string,
        // gameData: GeneratedGame
    ): Promise<string | null> {
        console.log(`PreviewService: Preparing game preview for project ${projectId}...`);
        // In a real implementation:
        // 1. Use FileService to ensure game files from gameData.files are in a servable location.
        // 2. If a build step is needed, trigger it.
        // 3. Return the accessible URL.
        // For now, this is a placeholder.
        // const entryFile = gameData.files.find(f => f.name.endsWith('.html'));
        // if (entryFile) {
        //   return `/public/${entryFile.path}`; // This assumes files are copied to a public path structure
        // }
        return null;
    }

    // Add other methods as needed, e.g., for cleaning up previews.
}

// Export a singleton instance if preferred, or allow instantiation.
// export const previewService = new PreviewService(/* new FileService() */);