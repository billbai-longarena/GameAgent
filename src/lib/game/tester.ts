import { GeneratedGame } from './generator';
import { File as ProjectFile } from '@/types/file'; // Use File as ProjectFile

export interface TestResult {
    passed: boolean;
    message: string;
    details?: any; // Could include specific test case results
}

export interface TestCase {
    id: string;
    description: string;
    assertion: () => Promise<boolean> | boolean; // Function to execute the test
}

/**
 * Handles basic testing for generated games.
 * This is a very simplified placeholder. A real system would involve:
 * - Test case generation (possibly AI-driven based on game type and content).
 * - Integration with testing frameworks (e.g., Jest, Cypress for UI tests if applicable).
 * - Execution of tests in a sandboxed environment.
 * - Detailed reporting.
 */
export class GameTester {
    constructor() {
        console.log('GameTester initialized.');
    }

    /**
     * Generates a basic set of test cases for a game.
     * @param game The generated game data.
     * @returns An array of TestCase objects.
     */
    public generateTestCases(game: GeneratedGame): TestCase[] {
        const testCases: TestCase[] = [];

        // Test 1: Check if essential files are present
        testCases.push({
            id: 'file-presence-check',
            description: 'Check if essential game files (HTML, config) are present.',
            assertion: () => {
                const htmlFile = game.files.find(f => f.name.endsWith('.html'));
                const configFile = game.files.find(f => f.name.endsWith('_config.json'));
                return !!htmlFile && !!configFile;
            },
        });

        // Test 2: Basic HTML content check (very superficial)
        const htmlFile = game.files.find(f => f.name.endsWith('.html'));
        if (htmlFile) {
            testCases.push({
                id: 'html-content-check',
                description: 'Check if HTML file has a title and body.',
                assertion: () => {
                    return !!htmlFile.content && htmlFile.content.includes('<title>') && htmlFile.content.includes('<body>');
                },
            });
        }

        // Test 3: Config file content check (e.g., has a title)
        const configFile = game.files.find(f => f.name.endsWith('_config.json'));
        if (configFile && configFile.content) { // Add check for configFile.content
            testCases.push({
                id: 'config-content-check',
                description: 'Check if config file can be parsed and has a title.',
                assertion: () => {
                    try {
                        const config = JSON.parse(configFile.content as string); // Assert content is string
                        return typeof config.title === 'string';
                    } catch (e) {
                        return false;
                    }
                },
            });
        }


        // More sophisticated tests would be added here based on game type,
        // e.g., for a quiz, check if questions array exists in config.

        console.log(`Generated ${testCases.length} basic test cases for game ${game.gameId}`);
        return testCases;
    }

    /**
     * Runs all generated test cases for a game.
     * @param game The generated game data.
     * @returns A Promise resolving to an array of TestResult objects.
     */
    public async runTests(game: GeneratedGame): Promise<TestResult[]> {
        const testCases = this.generateTestCases(game);
        const results: TestResult[] = [];

        for (const tc of testCases) {
            try {
                const passed = await tc.assertion();
                results.push({
                    passed,
                    message: `${tc.description}: ${passed ? 'Passed' : 'Failed'}`,
                    details: { testCaseId: tc.id },
                });
            } catch (error) {
                results.push({
                    passed: false,
                    message: `${tc.description}: Error during test execution.`,
                    details: { testCaseId: tc.id, error: (error as Error).message },
                });
            }
        }

        console.log(`Test run completed for game ${game.gameId}. Results:`, results.filter(r => !r.passed).length > 0 ? results.filter(r => !r.passed) : 'All passed!');
        return results;
    }

    /**
     * Provides an overall summary of the test run.
     * @param testResults Array of TestResult objects.
     * @returns A summary TestResult.
     */
    public summarizeResults(testResults: TestResult[]): TestResult {
        const failedCount = testResults.filter(r => !r.passed).length;
        if (failedCount === 0) {
            return {
                passed: true,
                message: `All ${testResults.length} tests passed.`,
                details: testResults,
            };
        } else {
            return {
                passed: false,
                message: `${failedCount} out of ${testResults.length} tests failed.`,
                details: testResults.filter(r => !r.passed),
            };
        }
    }
}