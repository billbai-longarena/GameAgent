/// <reference types="@testing-library/jest-dom" />
import '@testing-library/jest-dom'; // For .toBeInTheDocument() etc.
import { AIService } from '@/services/ai.service';

// Mock child_process and util.promisify
// We need to mock exec from child_process, which is then promisified.
const mockExecAsync = jest.fn();
jest.mock('child_process', () => ({
    ...jest.requireActual('child_process'), // Import and retain default behavior
    exec: jest.fn((command, options, callback) => {
        // This is the original callback-style exec.
        // We can delegate to mockExecAsync which simulates the promisified version.
        // Or, if AIService directly uses promisify(exec), we mock promisify.
        // Given AIService uses execAsync = promisify(exec), mocking promisify is cleaner.
        if (callback) { // callback style
            const promisifiedResult = mockExecAsync(command, options);
            promisifiedResult.then((res: any) => callback(null, res.stdout, res.stderr))
                .catch((err: any) => callback(err, '', ''));
        }
        return {}; // exec returns a ChildProcess, but we don't need to mock its full interface here
    }),
}));

jest.mock('util', () => ({
    ...jest.requireActual('util'),
    promisify: jest.fn(() => mockExecAsync), // Ensure promisify returns our mock for exec
}));


describe('AIService', () => {
    let originalApiKey: string | undefined;
    let originalProxyUrl: string | undefined;

    beforeEach(() => {
        // Store original env vars and clear/set them for tests
        originalApiKey = process.env.GEMINI_API_KEY;
        originalProxyUrl = process.env.PROXY_URL;

        delete process.env.GEMINI_API_KEY;
        delete process.env.PROXY_URL;

        jest.resetModules(); // Reset modules to re-evaluate process.env changes
        mockExecAsync.mockReset(); // Reset the mock before each test
    });

    afterEach(() => {
        // Restore original env vars
        if (originalApiKey !== undefined) process.env.GEMINI_API_KEY = originalApiKey;
        else delete process.env.GEMINI_API_KEY;

        if (originalProxyUrl !== undefined) process.env.PROXY_URL = originalProxyUrl;
        else delete process.env.PROXY_URL;

        jest.resetModules();
    });

    describe('isAvailable', () => {
        it('should return true if GEMINI_API_KEY is configured', () => {
            process.env.GEMINI_API_KEY = 'test-api-key';
            // Need to re-import or re-instantiate AIService after changing env var
            // due to how the GEMINI_API_KEY constant is captured at module load time.
            const { AIService: AIServiceScoped } = require('@/services/ai.service');
            const aiService = new AIServiceScoped();
            expect(aiService.isAvailable()).toBe(true);
        });

        it('should return false if GEMINI_API_KEY is not configured', () => {
            // GEMINI_API_KEY is deleted in beforeEach
            const { AIService: AIServiceScoped } = require('@/services/ai.service');
            const aiService = new AIServiceScoped();
            expect(aiService.isAvailable()).toBe(false);
        });
    });

    describe('generateText', () => {
        beforeEach(() => {
            mockExecAsync.mockReset(); // 确保每次测试前重置mock
        });

        it('should reject if GEMINI_API_KEY is not configured', async () => {
            const { AIService: AIServiceScoped } = require('@/services/ai.service');
            const aiService = new AIServiceScoped();
            await expect(aiService.generateText('test prompt')).rejects.toThrow('Gemini API Key is not configured');
        });

        it('should successfully generate text when API key is configured and API call is successful', async () => {
            process.env.GEMINI_API_KEY = 'test-key';
            process.env.PROXY_URL = 'http://proxy.example.com:8080'; // Ensure proxy is set if command uses it
            const { AIService: AIServiceScoped, aiService: aiServiceInstance } = require('@/services/ai.service');
            // const aiService = new AIServiceScoped(); // or use the singleton instance

            const mockApiResponse = {
                candidates: [{
                    content: {
                        parts: [{ text: 'Generated text from Gemini' }]
                    }
                }]
            };
            mockExecAsync.mockResolvedValue({ stdout: JSON.stringify(mockApiResponse), stderr: '' });

            const prompt = 'Hello Gemini';
            const result = await aiServiceInstance.generateText(prompt);
            expect(result).toBe('Generated text from Gemini');
            expect(mockExecAsync).toHaveBeenCalledTimes(1);
            // Optionally, check the command structure if needed
            const commandCalled = mockExecAsync.mock.calls[0][0];
            expect(commandCalled).toContain(`https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL_NAME || 'gemini-2.5-pro-exp-03-25'}:generateContent?key=test-key`);
            expect(commandCalled).toContain(JSON.stringify(prompt)); // Check if prompt is in the command body
            expect(commandCalled).toContain('-x "http://proxy.example.com:8080"');
        });

        it('should throw an error if curl command returns stderr', async () => {
            process.env.GEMINI_API_KEY = 'test-key';
            const { aiService: aiServiceInstance } = require('@/services/ai.service');

            mockExecAsync.mockResolvedValue({ stdout: '', stderr: 'curl error: connection refused' });

            await expect(aiServiceInstance.generateText('test prompt')).rejects.toThrow('curl command failed with stderr: curl error: connection refused');
        });

        it('should throw an error if curl command returns stderr as JSON error', async () => {
            process.env.GEMINI_API_KEY = 'test-key';
            const { aiService: aiServiceInstance } = require('@/services/ai.service');
            mockExecAsync.mockReset(); // 重置以确保只被调用一次
            const errorJson = { error: { message: "API key invalid" } };
            mockExecAsync.mockResolvedValue({ stdout: '', stderr: JSON.stringify(errorJson) });

            try {
                await aiServiceInstance.generateText('test prompt');
                fail('Expected to throw error but did not');
            } catch (error) {
                expect(error.message).toContain('Gemini API error via curl (stderr): API key invalid');
            }
        });

        it('should throw an error if curl command returns empty stdout', async () => {
            process.env.GEMINI_API_KEY = 'test-key';
            const { aiService: aiServiceInstance } = require('@/services/ai.service');
            mockExecAsync.mockResolvedValue({ stdout: '', stderr: '' });
            await expect(aiServiceInstance.generateText('test prompt')).rejects.toThrow('curl command returned empty stdout.');
        });

        it('should throw an error if Gemini API response JSON contains an error field', async () => {
            process.env.GEMINI_API_KEY = 'test-key';
            const { aiService: aiServiceInstance } = require('@/services/ai.service');
            const mockErrorResponse = { error: { message: 'Invalid request' } };
            mockExecAsync.mockResolvedValue({ stdout: JSON.stringify(mockErrorResponse), stderr: '' });
            await expect(aiServiceInstance.generateText('test prompt')).rejects.toThrow('Gemini API error: Invalid request');
        });

        it('should throw an error if Gemini API response has an invalid structure', async () => {
            process.env.GEMINI_API_KEY = 'test-key';
            const { aiService: aiServiceInstance } = require('@/services/ai.service');
            const mockInvalidResponse = { someOtherField: 'data' }; // Missing candidates, content, parts
            mockExecAsync.mockResolvedValue({ stdout: JSON.stringify(mockInvalidResponse), stderr: '' });
            await expect(aiServiceInstance.generateText('test prompt')).rejects.toThrow('Invalid response structure from Gemini API.');
        });

        it('should handle execAsync promise rejection', async () => {
            process.env.GEMINI_API_KEY = 'test-key';
            const { aiService: aiServiceInstance } = require('@/services/ai.service');
            mockExecAsync.mockRejectedValue(new Error('exec failed'));
            await expect(aiServiceInstance.generateText('test prompt')).rejects.toThrow('Failed to generate text using Gemini API (curl): exec failed');
        });
    });
});