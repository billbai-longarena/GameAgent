/// <reference types="@testing-library/jest-dom" />
import '@testing-library/jest-dom';
import { PreviewService } from '@/services/preview.service';

describe('PreviewService', () => {
    let previewService: PreviewService;

    beforeEach(() => {
        previewService = new PreviewService();
    });

    describe('getPreviewUrl', () => {
        const projectId = 'proj-123';
        const entryPoint = 'index.html';

        it('should generate correct URL for templates', () => {
            const templateId = 'quiz-template';
            const expectedUrl = `/templates/quiz/${entryPoint}`;
            const actualUrl = previewService.getPreviewUrl(projectId, templateId, entryPoint);
            expect(actualUrl).toBe(expectedUrl);
        });

        it('should generate correct URL for another template with different entry point', () => {
            const templateId = 'matching-game-template';
            const customEntryPoint = 'start.html';
            const expectedUrl = `/templates/matching-game/${customEntryPoint}`;
            const actualUrl = previewService.getPreviewUrl(projectId, templateId, customEntryPoint);
            expect(actualUrl).toBe(expectedUrl);
        });

        it('should generate correct URL for generated games', () => {
            const gameId = 'game-abc';
            const expectedUrl = `/generated_games/${projectId}/${gameId}/${entryPoint}`;
            const actualUrl = previewService.getPreviewUrl(projectId, gameId, entryPoint);
            expect(actualUrl).toBe(expectedUrl);
        });

        it('should handle game IDs that might coincidentally end with -template but are not templates if logic implies', () => {
            // This test depends on the "Simple check" `gameIdOrTemplateId.endsWith('-template')`
            // If a game ID could be, e.g., "my-awesome-game-template", it would be treated as a template.
            // The current logic is simple. If more robust differentiation is needed, the service logic would change.
            const gameIdLikeTemplate = 'my-game-ends-with-template'; // Does not match the simple check
            const expectedGameUrl = `/generated_games/${projectId}/${gameIdLikeTemplate}/${entryPoint}`;
            const actualGameUrl = previewService.getPreviewUrl(projectId, gameIdLikeTemplate, entryPoint);
            expect(actualGameUrl).toBe(expectedGameUrl);
        });
    });

    describe('prepareGamePreview', () => {
        it('should return null as it is a placeholder', async () => {
            const projectId = 'proj-456';
            // const mockGameData = { files: [{ name: 'index.html', path: 'game/index.html' }] } as any; // Example
            const result = await previewService.prepareGamePreview(projectId /*, mockGameData */);
            expect(result).toBeNull();
        });
    });
});