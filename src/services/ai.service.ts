import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const PROXY_URL = process.env.PROXY_URL;
const MODEL_NAME = process.env.GEMINI_MODEL_NAME || 'gemini-2.5-pro-exp-03-25'; // 使用环境变量或默认值
const GEMINI_API_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${GEMINI_API_KEY}`;

if (!GEMINI_API_KEY) {
    console.warn('AIService: Gemini API Key is not configured. AI service will not function.');
}

export class AIService {
    constructor() {
        if (!GEMINI_API_KEY) {
            console.warn('AIService Constructor: Gemini API Key is missing. AI functionalities might be limited or disabled.');
        } else {
            console.log('AIService Constructor: AI Service is configured with an API Key.');
        }
    }

    /**
     * 使用curl通过Gemini API生成文本
     * @param prompt 要发送给模型的提示
     * @returns 模型生成的文本
     */
    async generateText(prompt: string): Promise<string> {
        if (!GEMINI_API_KEY) {
            console.error('AIService: Gemini API Key is not configured. Cannot generate text.');
            return Promise.reject('Gemini API Key is not configured.');
        }

        console.log('AIService: Attempting to generate text with Gemini API.');
        console.log('AIService: Prompt received:', prompt);

        const requestBody = {
            contents: [{
                parts: [{
                    text: prompt
                }]
            }]
        };

        const requestBodyString = JSON.stringify(requestBody).replace(/'/g, "'\\''");

        const curlCommand = `curl -s -X POST "${GEMINI_API_ENDPOINT}" \
            -H "Content-Type: application/json" \
            -x "${PROXY_URL}" \
            -d '${requestBodyString}'`;

        console.log('AIService: Executing curl command...');
        // 对于生产环境，考虑移除或调整此日志的详细程度，因为它可能包含敏感信息（尽管API Key在URL中）
        // console.debug('AIService: Full curl command for debugging:', curlCommand);

        try {
            console.log('AIService: Sending request to Gemini API via curl.');
            const { stdout, stderr } = await execAsync(curlCommand, { timeout: 60000 }); // 增加超时到60秒

            if (stderr) {
                console.error('AIService: curl command stderr:', stderr);
                try {
                    const errorJson = JSON.parse(stderr);
                    if (errorJson.error && errorJson.error.message) {
                        throw new Error(`Gemini API error via curl (stderr): ${errorJson.error.message}`);
                    }
                } catch (e) {
                    // stderr 不是 JSON
                }
                throw new Error(`curl command failed with stderr: ${stderr}`);
            }

            if (!stdout) {
                console.error('AIService: curl command returned empty stdout.');
                throw new Error('curl command returned empty stdout.');
            }

            console.log('AIService: Raw response from Gemini API (stdout):', stdout);

            const responseJson = JSON.parse(stdout);

            if (responseJson.error) {
                console.error('AIService: Gemini API returned an error in response JSON:', responseJson.error);
                throw new Error(`Gemini API error: ${responseJson.error.message || JSON.stringify(responseJson.error)}`);
            }

            if (responseJson.candidates && responseJson.candidates.length > 0 &&
                responseJson.candidates[0].content && responseJson.candidates[0].content.parts &&
                responseJson.candidates[0].content.parts.length > 0 &&
                responseJson.candidates[0].content.parts[0].text) {
                const generatedText = responseJson.candidates[0].content.parts[0].text;
                console.log('AIService: Successfully parsed generated text from Gemini API.');
                console.log('AIService: Generated text:', generatedText);
                return generatedText;
            } else {
                console.error('AIService: Invalid or unexpected response structure from Gemini API:', stdout);
                throw new Error('Invalid response structure from Gemini API.');
            }
        } catch (error: any) {
            console.error('AIService: Error during curl execution or response processing:', error.message);
            if (error.stdout) console.error("AIService: Error stdout content:", error.stdout);
            if (error.stderr) console.error("AIService: Error stderr content:", error.stderr);
            // 抛出更具体的错误信息
            throw new Error(`Failed to generate text using Gemini API (curl): ${error.message}`);
        }
    }

    /**
     * 检查AI服务是否可用 (API密钥是否配置)
     */
    isAvailable(): boolean {
        // 对于 curl 方法，主要依赖 API key 是否配置
        // 也可以添加一个简单的 curl --version 检查，但暂时保持简单
        return !!GEMINI_API_KEY;
    }
}

// 导出一个单例，方便在其他地方使用
export const aiService = new AIService();

// IIFE for self-testing the AIService on module load
(async () => {
    console.log('AIService Self-Test (curl): Starting...');
    if (aiService.isAvailable()) {
        try {
            const testPrompt = '你好，Gemini！请用中文回复 "测试成功" 如果你能收到这条消息。';
            console.log(`AIService Self-Test (curl): Sending prompt: "${testPrompt}"`);
            const response = await aiService.generateText(testPrompt);
            console.log('AIService Self-Test (curl): Response from Gemini:', response);
            if (response.includes('测试成功')) {
                console.log('AIService Self-Test (curl): PASSED - Gemini responded as expected.');
            } else {
                console.error('AIService Self-Test (curl): FAILED - Gemini response did not contain "测试成功". Response:', response);
            }
        } catch (error) {
            console.error('AIService Self-Test (curl): FAILED - Error during generateText call:', error);
        }
    } else {
        console.warn('AIService Self-Test (curl): SKIPPED - AI Service is not available (API Key not configured).');
    }
    console.log('AIService Self-Test (curl): Finished.');
})();
