import { exec } from 'child_process';
import { promisify } from 'util';
import { WebSocketService } from './websocket.service';
import { LogLevel } from '@/types/agent';

const execAsync = promisify(exec);

const NEW_API_KEY = 'sk-b2353c2803ba4d0395f91ee12100d964';
const NEW_API_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
const NEW_MODEL_NAME = 'qwen-plus-2025-04-28';
const MAX_TOKENS = 16191;

// 创建WebSocketService实例
const websocketService = new WebSocketService();

// 辅助函数，生成UUID
function generateUUID(): string {
    // 如果浏览器环境支持 crypto.randomUUID()
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }

    // 兼容性实现，用于测试环境或不支持crypto.randomUUID的浏览器
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// 辅助函数，发送日志到前端
function sendLog(message: string, level: LogLevel = LogLevel.INFO, context?: any) {
    // 使用一个固定的projectId，因为AIService不知道当前的projectId
    const projectId = 'global';
    websocketService.sendAgentLog(projectId, {
        id: generateUUID(),
        message: `AIService: ${message}`,
        level,
        timestamp: new Date(),
        context
    });
}

if (!NEW_API_KEY) {
    sendLog('New API Key is not configured. AI service will not function.', LogLevel.WARNING);
}

export class AIService {
    constructor() {
        if (!NEW_API_KEY) {
            sendLog('Constructor: New API Key is missing. AI functionalities might be limited or disabled.', LogLevel.WARNING);
        } else {
            sendLog('Constructor: AI Service is configured with the new API Key.', LogLevel.INFO);
        }
    }

    /**
     * 使用curl通过新的AI API生成文本
     * @param prompt 要发送给模型的提示
     * @returns 模型生成的文本
     */
    async generateText(prompt: string): Promise<string> {
        if (!NEW_API_KEY) {
            sendLog('New API Key is not configured. Cannot generate text.', LogLevel.ERROR);
            throw new Error('New API Key is not configured');
        }

        sendLog('Attempting to generate text with New API.', LogLevel.INFO);
        sendLog(`PROMPT >>>\n${prompt}\n<<< END PROMPT`, LogLevel.INFO);

        const requestBody = {
            model: NEW_MODEL_NAME,
            messages: [{
                role: "user",
                content: prompt
            }],
            max_tokens: MAX_TOKENS
        };

        const requestBodyString = JSON.stringify(requestBody).replace(/'/g, "'\\''");

        const curlCommand = `curl -s -X POST "${NEW_API_URL}" \
            -H "Authorization: Bearer ${NEW_API_KEY}" \
            -H "Content-Type: application/json" \
            -d '${requestBodyString}'`;

        sendLog('Executing curl command...', LogLevel.INFO);
        // sendLog('Full curl command for debugging: ' + curlCommand, LogLevel.DEBUG);

        try {
            sendLog('Sending request to New API via curl.', LogLevel.INFO);
            const result = await execAsync(curlCommand, { timeout: 60000 });

            if (!result) {
                sendLog('execAsync returned undefined or null', LogLevel.ERROR);
                throw new Error('curl command execution failed with no result');
            }

            const { stdout, stderr } = result;

            if (stderr) {
                sendLog(`curl command stderr: ${stderr}`, LogLevel.ERROR);
                // OpenAI compatible APIs usually return errors in stdout JSON
                // However, if stderr has content, it's likely a curl or network issue
                throw new Error(`curl command failed with stderr: ${stderr}`);
            }

            if (!stdout) {
                sendLog('curl command returned empty stdout.', LogLevel.ERROR);
                throw new Error('curl command returned empty stdout.');
            }

            sendLog('Raw response from New API received.', LogLevel.INFO, { stdout });

            const responseJson = JSON.parse(stdout);

            if (responseJson.error) {
                sendLog(`New API returned an error in response JSON: ${JSON.stringify(responseJson.error)}`, LogLevel.ERROR);
                throw new Error(`New API error: ${responseJson.error.message || JSON.stringify(responseJson.error)}`);
            }

            if (responseJson.choices && responseJson.choices.length > 0 &&
                responseJson.choices[0].message && responseJson.choices[0].message.content) {
                const generatedText = responseJson.choices[0].message.content;
                sendLog('Successfully parsed generated text from New API.', LogLevel.INFO);
                sendLog(`RESPONSE >>>\n${generatedText}\n<<< END RESPONSE`, LogLevel.INFO);
                return generatedText;
            } else {
                sendLog(`Invalid or unexpected response structure from New API: ${stdout}`, LogLevel.ERROR);
                throw new Error('Invalid response structure from New API.');
            }
        } catch (error: any) {
            sendLog(`Error during curl execution or response processing: ${error.message}`, LogLevel.ERROR);
            if (error.stdout) sendLog(`Error stdout content: ${error.stdout}`, LogLevel.ERROR);
            if (error.stderr) sendLog(`Error stderr content: ${error.stderr}`, LogLevel.ERROR);
            throw new Error(`Failed to generate text using New API (curl): ${error.message}`);
        }
    }

    /**
     * 检查AI服务是否可用 (API密钥是否配置)
     */
    isAvailable(): boolean {
        return !!NEW_API_KEY;
    }
}

// 导出一个单例，方便在其他地方使用
export const aiService = new AIService();

// IIFE for self-testing the AIService on module load
// 跳过在测试环境中运行自测试，避免测试中的多次调用
(async () => {
    // 检查是否在测试环境中运行
    if (process.env.NODE_ENV === 'test') {
        sendLog('Self-Test (New API): Skipped in test environment', LogLevel.INFO);
        return;
    }

    sendLog('Self-Test (New API): Starting...', LogLevel.INFO);
    if (aiService.isAvailable()) {
        try {
            const testPrompt = '你好！请用中文回复 "测试成功" 如果你能收到这条消息。';
            sendLog(`Self-Test (New API): Sending prompt: "${testPrompt}"`, LogLevel.INFO);
            const response = await aiService.generateText(testPrompt);
            sendLog(`Self-Test (New API): Response from New API: ${response}`, LogLevel.INFO);
            if (response.includes('测试成功')) {
                sendLog('Self-Test (New API): PASSED - New API responded as expected.', LogLevel.SUCCESS);
            } else {
                sendLog(`Self-Test (New API): FAILED - New API response did not contain "测试成功". Response: ${response}`, LogLevel.ERROR);
            }
        } catch (error) {
            sendLog(`Self-Test (New API): FAILED - Error during generateText call: ${error}`, LogLevel.ERROR);
        }
    } else {
        sendLog('Self-Test (New API): SKIPPED - AI Service is not available (API Key not configured).', LogLevel.WARNING);
    }
    sendLog('Self-Test (New API): Finished.', LogLevel.INFO);
})();
