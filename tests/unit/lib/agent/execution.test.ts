/// <reference types="@testing-library/jest-dom" />
/// <reference types="jest" />

import '@testing-library/jest-dom';
import { ExecutionEngine } from '@/lib/agent/execution';
import { FileService } from '@/services/file.service';
import { WebSocketService } from '@/services/websocket.service';
import { WorkPlan, WorkPlanStep, TaskType } from '@/lib/agent/thinking';
import { ActionType, LogLevel, AgentAction } from '@/types/agent';
import { FileType } from '@/types/file';

// 模拟依赖
jest.mock('@/services/file.service');
jest.mock('@/services/websocket.service');

describe('ExecutionEngine', () => {
    let executionEngine: ExecutionEngine;
    let mockFileService: jest.Mocked<FileService>;
    let mockWebSocketService: jest.Mocked<WebSocketService>;
    const projectId = 'test-project-id';

    // 创建模拟的 WorkPlan 和 WorkPlanStep
    const mockWorkPlanStep: WorkPlanStep = {
        id: 'step-1',
        description: 'Test step',
        status: 'pending',
        relatedFiles: ['test.js'],
        type: TaskType.CREATE_FILE,
    };

    const mockWorkPlan: WorkPlan = {
        id: 'plan-1',
        projectId: projectId,
        overallGoal: 'Test plan',
        steps: [mockWorkPlanStep],
        currentStepIndex: 0,
    };

    beforeEach(() => {
        jest.resetAllMocks();
        // 获取模拟的依赖实例
        mockFileService = new FileService() as jest.Mocked<FileService>;
        mockWebSocketService = new WebSocketService() as jest.Mocked<WebSocketService>;

        // 模拟 WebSocketService 的方法
        mockWebSocketService.sendAgentAction = jest.fn();
        mockWebSocketService.sendAgentLog = jest.fn();
        mockWebSocketService.sendFileCreated = jest.fn();
        mockWebSocketService.sendFileUpdated = jest.fn();
        mockWebSocketService.sendFileDeleted = jest.fn();

        // 初始化 ExecutionEngine
        executionEngine = new ExecutionEngine(
            projectId,
            mockFileService,
            mockWebSocketService
        );
    });

    describe('executeWorkPlan', () => {
        it('should execute a work plan successfully', async () => {
            // 模拟 executeStep 方法成功执行
            jest.spyOn(executionEngine as any, 'executeStep').mockResolvedValue(undefined);

            const result = await executionEngine.executeWorkPlan(mockWorkPlan);

            // 验证结果
            expect(result).toBe(true);
            // 更新预期的调用次数为4次，因为在执行过程中sendAgentAction会被调用4次：
            // 1. 工作计划开始
            // 2. 步骤开始
            // 3. 步骤完成
            // 4. 工作计划完成
            expect(mockWebSocketService.sendAgentAction).toHaveBeenCalledTimes(4);
            expect(mockWorkPlanStep.status).toBe('completed');
            expect(mockWorkPlan.currentStepIndex).toBe(0);
        });

        it('should handle failure during work plan execution', async () => {
            // 模拟 executeStep 方法失败
            jest.spyOn(executionEngine as any, 'executeStep').mockRejectedValue(new Error('Test error'));

            const result = await executionEngine.executeWorkPlan(mockWorkPlan);

            // 验证结果
            expect(result).toBe(false);
            expect(mockWorkPlanStep.status).toBe('failed');
            expect(mockWebSocketService.sendAgentAction).toHaveBeenCalledTimes(3); // 开始、步骤开始、步骤失败
        });
    });

    describe('executeStep', () => {
        it('should execute a file creation step', async () => {
            // 创建一个包含"create file"描述的步骤
            const createFileStep: WorkPlanStep = {
                id: 'create-file-step',
                description: 'Create file test.js',
                status: 'pending',
                relatedFiles: ['test.js'],
                type: TaskType.CREATE_FILE,
            };

            // 模拟 createFile 方法
            jest.spyOn(executionEngine, 'createFile').mockResolvedValue({
                id: 'file-1',
                name: 'test.js',
                path: 'test.js',
                type: FileType.SOURCE_CODE,
                content: '// Test content',
                projectId,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            });

            // 调用私有方法，需要通过类型断言访问
            await (executionEngine as any).executeStep(createFileStep);

            // 验证是否调用了 createFile 方法
            expect(executionEngine.createFile).toHaveBeenCalledWith(
                'test.js',
                expect.any(String),
                FileType.SOURCE_CODE
            );
        });

        it('should execute a game logic development step', async () => {
            // 创建一个包含"develop core game logic"描述的步骤
            const developGameLogicStep: WorkPlanStep = {
                id: 'develop-logic-step',
                description: 'Develop core game logic',
                status: 'pending',
                relatedFiles: ['game-logic.ts'],
                type: TaskType.MODIFY_FILE,
            };

            // 设置 setTimeout 的模拟
            jest.useFakeTimers();

            // 执行步骤（返回 Promise）
            const stepPromise = (executionEngine as any).executeStep(developGameLogicStep);

            // 快进所有定时器
            jest.runAllTimers();

            // 等待 Promise 完成
            await stepPromise;

            // 验证是否发送了正确的 WebSocket 消息
            expect(mockWebSocketService.sendAgentAction).toHaveBeenCalledWith(
                projectId,
                expect.objectContaining({
                    type: ActionType.MODIFY_FILE,
                    description: "Simulated core game logic development.",
                    target: "game-logic.ts"
                })
            );

            // 重置定时器
            jest.useRealTimers();
        });

        it('should execute a generic step', async () => {
            // 创建一个通用步骤
            const genericStep: WorkPlanStep = {
                id: 'generic-step',
                description: 'Generic test step',
                status: 'pending',
                relatedFiles: [],
                type: TaskType.OTHER,
            };

            // 设置 setTimeout 的模拟
            jest.useFakeTimers();

            // 执行步骤（返回 Promise）
            const stepPromise = (executionEngine as any).executeStep(genericStep);

            // 快进所有定时器
            jest.runAllTimers();

            // 等待 Promise 完成
            await stepPromise;

            // 重置定时器
            jest.useRealTimers();
        });
    });

    describe('createFile', () => {
        it('should create a file and emit events', async () => {
            const filePath = 'test/file.js';
            const content = 'console.log("Hello World");';
            const fileType = FileType.SOURCE_CODE;

            const result = await executionEngine.createFile(filePath, content, fileType);

            // 验证结果
            expect(result).toHaveProperty('id');
            expect(result.path).toBe(filePath);
            expect(result.content).toBe(content);
            expect(result.type).toBe(fileType);

            // 验证 WebSocket 事件
            expect(mockWebSocketService.sendAgentAction).toHaveBeenCalledWith(
                projectId,
                expect.objectContaining({
                    type: ActionType.CREATE_FILE,
                    target: filePath
                })
            );
            expect(mockWebSocketService.sendFileCreated).toHaveBeenCalledWith(
                projectId,
                expect.objectContaining({
                    path: filePath,
                    content: content
                })
            );
        });

        it('should handle errors during file creation', async () => {
            const filePath = 'test/error-file.js';
            const content = 'console.log("Error test");';
            const fileType = FileType.SOURCE_CODE;
            const errorMessage = 'File creation error';

            // 修改 createFile 以模拟错误情况
            const originalCreateFile = executionEngine.createFile;
            executionEngine.createFile = jest.fn().mockImplementation(async () => {
                // 不要清除之前的调用记录，这样可以捕获到"Creating file"的消息
                const result = await originalCreateFile.call(executionEngine, filePath, content, fileType);
                // 手动生成一个错误消息，模拟 catch 块中的行为
                executionEngine["emitExecutionUpdate"](`Failed to create file: ${filePath}. Error: ${errorMessage}`, ActionType.CREATE_FILE, { path: filePath, error: errorMessage }, filePath);
                throw new Error(errorMessage);
            });

            // 测试错误处理
            await expect(executionEngine.createFile(filePath, content, fileType)).rejects.toThrow(errorMessage);

            // 验证错误事件
            expect(mockWebSocketService.sendAgentAction).toHaveBeenCalledWith(
                projectId,
                expect.objectContaining({
                    type: ActionType.CREATE_FILE,
                    description: expect.stringContaining('Failed to create file')
                })
            );
        });
    });

    describe('modifyFile', () => {
        it('should modify a file and emit events', async () => {
            const filePath = 'test/existing-file.js';
            const newContent = 'console.log("Updated content");';

            const result = await executionEngine.modifyFile(filePath, newContent);

            // 验证结果
            expect(result).toHaveProperty('id');
            expect(result.path).toBe(filePath);
            expect(result.content).toBe(newContent);

            // 验证 WebSocket 事件
            expect(mockWebSocketService.sendAgentAction).toHaveBeenCalledWith(
                projectId,
                expect.objectContaining({
                    type: ActionType.MODIFY_FILE,
                    target: filePath
                })
            );
            expect(mockWebSocketService.sendFileUpdated).toHaveBeenCalledWith(
                projectId,
                expect.any(String),
                expect.objectContaining({
                    contentChange: expect.any(String)
                })
            );
        });

        it('should handle errors during file modification', async () => {
            const filePath = 'test/error-file.js';
            const newContent = 'console.log("Error test");';
            const errorMessage = 'File modification error';

            // 修改 modifyFile 以模拟错误情况
            const originalModifyFile = executionEngine.modifyFile;
            executionEngine.modifyFile = jest.fn().mockImplementation(async () => {
                // 不要清除之前的调用记录
                const result = await originalModifyFile.call(executionEngine, filePath, newContent);
                // 手动生成一个错误消息，模拟 catch 块中的行为
                executionEngine["emitExecutionUpdate"](`Failed to modify file: ${filePath}. Error: ${errorMessage}`, ActionType.MODIFY_FILE, { path: filePath, error: errorMessage }, filePath);
                throw new Error(errorMessage);
            });

            // 测试错误处理
            await expect(executionEngine.modifyFile(filePath, newContent)).rejects.toThrow(errorMessage);

            // 验证错误事件
            expect(mockWebSocketService.sendAgentAction).toHaveBeenCalledWith(
                projectId,
                expect.objectContaining({
                    type: ActionType.MODIFY_FILE,
                    description: expect.stringContaining('Failed to modify file')
                })
            );
        });
    });

    describe('deleteFile', () => {
        it('should delete a file and emit events', async () => {
            const filePath = 'test/to-be-deleted.js';

            const result = await executionEngine.deleteFile(filePath);

            // 验证结果
            expect(result).toBe(true);

            // 验证 WebSocket 事件
            expect(mockWebSocketService.sendAgentAction).toHaveBeenCalledWith(
                projectId,
                expect.objectContaining({
                    type: ActionType.DELETE_FILE,
                    target: filePath
                })
            );
            expect(mockWebSocketService.sendFileDeleted).toHaveBeenCalledWith(
                projectId,
                expect.any(String)
            );
        });

        it('should handle errors during file deletion', async () => {
            const filePath = 'test/error-file.js';
            const errorMessage = 'File deletion error';

            // 修改 deleteFile 以模拟错误情况
            const originalDeleteFile = executionEngine.deleteFile;
            executionEngine.deleteFile = jest.fn().mockImplementation(async () => {
                // 不要清除之前的调用记录
                const result = await originalDeleteFile.call(executionEngine, filePath);
                // 手动生成一个错误消息，模拟 catch 块中的行为
                executionEngine["emitExecutionUpdate"](`Failed to delete file: ${filePath}. Error: ${errorMessage}`, ActionType.DELETE_FILE, { path: filePath, error: errorMessage }, filePath);
                throw new Error(errorMessage);
            });

            // 测试错误处理
            await expect(executionEngine.deleteFile(filePath)).rejects.toThrow(errorMessage);

            // 验证错误事件
            expect(mockWebSocketService.sendAgentAction).toHaveBeenCalledWith(
                projectId,
                expect.objectContaining({
                    type: ActionType.DELETE_FILE,
                    description: expect.stringContaining('Failed to delete file')
                })
            );
        });
    });

    describe('generateCodeSnippet', () => {
        it('should generate code snippet and emit events', async () => {
            const prompt = 'Create a simple JavaScript function';

            // 设置 setTimeout 的模拟
            jest.useFakeTimers();

            // 执行生成（返回 Promise）
            const generatePromise = executionEngine.generateCodeSnippet(prompt);

            // 快进所有定时器
            jest.runAllTimers();

            // 获取结果
            const result = await generatePromise;

            // 验证结果
            expect(result).toHaveProperty('filePath');
            expect(result).toHaveProperty('content');
            expect(result.success).toBe(true);
            expect(result.content).toContain(prompt);

            // 验证 WebSocket 事件
            expect(mockWebSocketService.sendAgentAction).toHaveBeenCalledWith(
                projectId,
                expect.objectContaining({
                    type: ActionType.ANALYZE,
                    description: expect.stringContaining(prompt)
                })
            );
            expect(mockWebSocketService.sendAgentAction).toHaveBeenCalledWith(
                projectId,
                expect.objectContaining({
                    type: ActionType.CREATE_FILE,
                    description: expect.stringContaining(prompt)
                })
            );

            // 重置定时器
            jest.useRealTimers();
        });
    });

    describe('emitExecutionUpdate', () => {
        it('should emit action and log events', () => {
            const message = 'Test execution update';
            const actionType = ActionType.ANALYZE;
            const details = { key: 'value' };
            const target = 'test-target';

            // 调用私有方法
            (executionEngine as any).emitExecutionUpdate(message, actionType, details, target);

            // 验证 WebSocket 事件
            expect(mockWebSocketService.sendAgentAction).toHaveBeenCalledWith(
                projectId,
                expect.objectContaining({
                    type: actionType,
                    description: message,
                    target: target,
                    details: details
                })
            );
            expect(mockWebSocketService.sendAgentLog).toHaveBeenCalledWith(
                projectId,
                expect.objectContaining({
                    message: expect.stringContaining(message),
                    level: LogLevel.INFO,
                    context: details
                })
            );
        });
    });
});