/// <reference types="@testing-library/jest-dom" />
/// <reference types="jest" />

import '@testing-library/jest-dom';
import { FileService } from '@/services/file.service';
import { AIService } from '@/services/ai.service';
import { GameType } from '@/types/project';

// 假设存在一个GameGenerator类，如果不存在我们需要创建
// 这个测试基于游戏生成器的基本功能实现
class GameGenerator {
    private fileService: FileService;
    private aiService: AIService;

    constructor(fileService: FileService, aiService: AIService) {
        this.fileService = fileService;
        this.aiService = aiService;
    }

    /**
     * 根据游戏类型和要求生成游戏
     */
    async generateGame(projectId: string, gameType: GameType, requirements: string[]): Promise<{
        success: boolean;
        files: Array<{ name: string; path: string; content: string }>;
        entryPoint: string;
    }> {
        try {
            // 这里会调用AI服务生成游戏代码并保存文件
            const gamePrompt = this.createGamePrompt(gameType, requirements);
            const gameStructure = await this.aiService.generateText(gamePrompt);

            const parsedStructure = this.parseGameStructure(gameStructure);
            const gameFiles = [];

            // 创建游戏文件
            const basePath = `projects/${projectId}/game`;
            for (const file of parsedStructure.files) {
                await this.fileService.writeFile(`${basePath}/${file.path}`, file.content);
                gameFiles.push({
                    name: file.name,
                    path: `${basePath}/${file.path}`,
                    content: file.content
                });
            }

            return {
                success: true,
                files: gameFiles,
                entryPoint: parsedStructure.entryPoint
            };
        } catch (error) {
            console.error('Failed to generate game:', error);
            return {
                success: false,
                files: [],
                entryPoint: ''
            };
        }
    }

    /**
     * 创建用于生成游戏的提示
     */
    private createGamePrompt(gameType: GameType, requirements: string[]): string {
        const promptParts = [
            `创建一个${gameType.toString().toUpperCase()}类型的游戏，满足以下要求：`,
            ...requirements.map(req => `- ${req}`),
            '请提供以下文件的完整代码：',
            '1. HTML文件作为入口',
            '2. CSS样式文件',
            '3. JavaScript逻辑文件',
            '如果需要，也可以提供JSON数据文件'
        ];

        return promptParts.join('\n');
    }

    /**
     * 解析AI返回的游戏结构
     */
    private parseGameStructure(aiResponse: string): {
        files: Array<{ name: string; path: string; content: string }>;
        entryPoint: string;
    } {
        // 简单实现，真实场景下需要更复杂的解析逻辑
        const files = [];
        let entryPoint = 'index.html';

        // 假设AI返回的结构是带有文件分隔的代码块
        const fileBlocks = aiResponse.split('###FILE:');

        for (let i = 1; i < fileBlocks.length; i++) {
            const block = fileBlocks[i];
            const firstNewline = block.indexOf('\n');
            const filename = block.substring(0, firstNewline).trim();
            const content = block.substring(firstNewline).trim();

            files.push({
                name: filename,
                path: filename,
                content: content
            });

            if (filename.endsWith('.html')) {
                entryPoint = filename;
            }
        }

        return {
            files,
            entryPoint
        };
    }
}

// 模拟依赖
jest.mock('@/services/file.service');
jest.mock('@/services/ai.service', () => {
    return {
        AIService: jest.fn().mockImplementation(() => {
            return {
                generateText: jest.fn()
            };
        }),
        // 为了满足导入要求，也模拟单例
        aiService: {
            generateText: jest.fn(),
            isAvailable: jest.fn().mockReturnValue(true)
        }
    };
});

describe('GameGenerator', () => {
    let gameGenerator: GameGenerator;
    let mockFileService: jest.Mocked<FileService>;
    let mockAIService: jest.Mocked<AIService>;
    const projectId = 'test-project-id';

    beforeEach(() => {
        jest.resetAllMocks();

        // 创建模拟依赖
        mockFileService = {
            writeFile: jest.fn().mockResolvedValue(undefined)
        } as unknown as jest.Mocked<FileService>;

        mockAIService = {
            generateText: jest.fn()
        } as unknown as jest.Mocked<AIService>;

        // 创建GameGenerator实例
        gameGenerator = new GameGenerator(mockFileService, mockAIService);
    });

    describe('generateGame', () => {
        it('should generate a game successfully', async () => {
            // 模拟AI服务返回游戏代码
            const mockAIResponse = `
###FILE:index.html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Quiz Game</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div id="quiz-container">
        <h1>Quiz Game</h1>
        <div id="question"></div>
        <div id="options"></div>
        <button id="next">Next</button>
        <div id="result"></div>
    </div>
    <script src="script.js"></script>
</body>
</html>

###FILE:style.css
body {
    font-family: Arial, sans-serif;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    background-color: #f5f5f5;
}

#quiz-container {
    background-color: white;
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0 0 10px rgba(0,0,0,0.1);
    width: 500px;
}

###FILE:script.js
const questions = [
    {
        question: "What is 2 + 2?",
        options: ["3", "4", "5", "6"],
        answer: 1
    },
    {
        question: "What is the capital of France?",
        options: ["London", "Berlin", "Paris", "Madrid"],
        answer: 2
    }
];

let currentQuestion = 0;
let score = 0;

function loadQuestion() {
    const questionElement = document.getElementById('question');
    const optionsElement = document.getElementById('options');
    const question = questions[currentQuestion];
    
    questionElement.textContent = question.question;
    optionsElement.innerHTML = '';
    
    question.options.forEach((option, index) => {
        const button = document.createElement('button');
        button.textContent = option;
        button.onclick = () => checkAnswer(index);
        optionsElement.appendChild(button);
    });
}

function checkAnswer(index) {
    if (index === questions[currentQuestion].answer) {
        score++;
    }
    
    currentQuestion++;
    if (currentQuestion < questions.length) {
        loadQuestion();
    } else {
        showResult();
    }
}

function showResult() {
    const resultElement = document.getElementById('result');
    resultElement.textContent = \`Your score is \${score} out of \${questions.length}\`;
}

document.getElementById('next').addEventListener('click', () => {
    currentQuestion++;
    if (currentQuestion < questions.length) {
        loadQuestion();
    } else {
        showResult();
    }
});

window.onload = loadQuestion;
`;

            mockAIService.generateText = jest.fn().mockResolvedValue(mockAIResponse);

            // 调用generateGame方法
            const requirements = ['Include at least 2 questions', 'Show final score at the end'];
            const result = await gameGenerator.generateGame(projectId, GameType.QUIZ, requirements);

            // 验证结果
            expect(result.success).toBe(true);
            expect(result.files.length).toBe(3); // HTML, CSS, JS
            expect(result.entryPoint).toBe('index.html');

            // 验证方法调用
            expect(mockAIService.generateText).toHaveBeenCalledWith(expect.any(String));
            const prompt = mockAIService.generateText.mock.calls[0][0];
            expect(prompt).toContain('QUIZ');
            expect(prompt).toContain('Include at least 2 questions');

            // 验证文件写入调用
            expect(mockFileService.writeFile).toHaveBeenCalledTimes(3);
            expect(mockFileService.writeFile).toHaveBeenCalledWith(
                expect.stringContaining(`projects/${projectId}/game/index.html`),
                expect.stringContaining('<!DOCTYPE html>')
            );
        });

        it('should handle errors during game generation', async () => {
            // 模拟AI服务抛出错误
            mockAIService.generateText.mockRejectedValueOnce(new Error('AI service error'));

            // 调用generateGame方法
            const requirements = ['Include at least 2 questions'];
            const result = await gameGenerator.generateGame(projectId, GameType.QUIZ, requirements);

            // 验证结果
            expect(result.success).toBe(false);
            expect(result.files.length).toBe(0);
            expect(result.entryPoint).toBe('');

            // 验证文件写入没有被调用
            expect(mockFileService.writeFile).not.toHaveBeenCalled();
        });
    });

    describe('createGamePrompt', () => {
        it('should create a proper prompt for the AI service', () => {
            // 这是测试私有方法，通过类型转换访问
            const gameType = GameType.MATCHING;
            const requirements = ['Include 5 pairs of matching items', 'Add a timer'];

            const prompt = (gameGenerator as any).createGamePrompt(gameType, requirements);

            expect(prompt).toContain('MATCHING');
            expect(prompt).toContain('Include 5 pairs of matching items');
            expect(prompt).toContain('Add a timer');
            expect(prompt).toContain('HTML文件作为入口');
        });
    });

    describe('parseGameStructure', () => {
        it('should correctly parse AI response into file structure', () => {
            const aiResponse = `
###FILE:index.html
<html>Test HTML</html>

###FILE:style.css
body { color: red; }

###FILE:script.js
console.log('test');
`;

            const result = (gameGenerator as any).parseGameStructure(aiResponse);

            expect(result.files.length).toBe(3);
            expect(result.entryPoint).toBe('index.html');

            // 验证第一个文件
            expect(result.files[0].name).toBe('index.html');
            expect(result.files[0].content).toContain('Test HTML');

            // 验证第二个文件
            expect(result.files[1].name).toBe('style.css');
            expect(result.files[1].content).toContain('color: red');
        });

        it('should handle empty AI response', () => {
            const result = (gameGenerator as any).parseGameStructure('');

            expect(result.files.length).toBe(0);
            expect(result.entryPoint).toBe('index.html'); // 默认值
        });
    });
});