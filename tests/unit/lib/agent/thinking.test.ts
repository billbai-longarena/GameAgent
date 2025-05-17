/// <reference types="@testing-library/jest-dom" />
/// <reference types="jest" />

import '@testing-library/jest-dom';
import { ThinkingEngine, RequirementAnalysis, WorkPlan, TaskType, ProblemDetails, SolutionProposal } from '@/lib/agent/thinking';
import { AIService } from '@/services/ai.service';
import { WebSocketService } from '@/services/websocket.service';
import { ActionType } from '@/types/agent';

// 模拟依赖
jest.mock('@/services/ai.service');
jest.mock('@/services/websocket.service');

describe('ThinkingEngine', () => {
    let thinkingEngine: ThinkingEngine;
    let mockAIService: jest.Mocked<AIService>;
    let mockWebSocketService: jest.Mocked<WebSocketService>;
    const projectId = 'test-project-id';

    beforeEach(() => {
        jest.resetAllMocks();
        // 获取模拟的依赖实例
        mockAIService = new AIService() as jest.Mocked<AIService>;
        mockWebSocketService = new WebSocketService() as jest.Mocked<WebSocketService>;

        // 模拟 WebSocketService 的方法
        mockWebSocketService.sendAgentThinking = jest.fn();
        mockWebSocketService.sendAgentAction = jest.fn();

        // 模拟 AIService 的方法
        mockAIService.generateText = jest.fn();
        mockAIService.isAvailable = jest.fn().mockReturnValue(true);

        // 初始化 ThinkingEngine
        thinkingEngine = new ThinkingEngine(
            mockAIService,
            mockWebSocketService
        );
    });

    describe('analyzeRequirement', () => {
        it('should analyze requirements successfully', async () => {
            const instruction = 'Create a quiz game with 10 questions';

            // 设置 setTimeout 的模拟
            jest.useFakeTimers();

            // 执行需求分析
            const analysisPromise = thinkingEngine.analyzeRequirement(projectId, instruction);

            // 快进所有定时器
            jest.runAllTimers();

            // 获取结果
            const analysis = await analysisPromise;

            // 验证结果
            expect(analysis).toBeDefined();
            expect(analysis.originalInstruction).toBe(instruction);
            expect(analysis.parsedRequirements.length).toBeGreaterThan(0);
            expect(analysis.constraints.length).toBeGreaterThan(0);
            expect(analysis.goals.length).toBeGreaterThan(0);

            // 验证 WebSocket 事件
            expect(mockWebSocketService.sendAgentThinking).toHaveBeenCalledWith(
                projectId,
                expect.stringContaining(instruction)
            );
            expect(mockWebSocketService.sendAgentAction).toHaveBeenCalledWith(
                projectId,
                expect.objectContaining({
                    type: ActionType.ANALYZE,
                    description: expect.stringContaining('requirement analysis')
                })
            );

            // 重置定时器
            jest.useRealTimers();
        });

        it('should identify complex instructions and suggest clarifications', async () => {
            const instruction = 'Create a complex quiz game';

            // 设置 setTimeout 的模拟
            jest.useFakeTimers();

            // 执行需求分析
            const analysisPromise = thinkingEngine.analyzeRequirement(projectId, instruction);

            // 快进所有定时器
            jest.runAllTimers();

            // 获取结果
            const analysis = await analysisPromise;

            // 验证结果包含澄清请求
            expect(analysis.clarificationsNeeded).toBeDefined();
            expect(analysis.clarificationsNeeded!.length).toBeGreaterThan(0);

            // 验证 WebSocket 事件包含关于复杂性的消息
            expect(mockWebSocketService.sendAgentThinking).toHaveBeenCalledWith(
                projectId,
                expect.stringContaining('complexity')
            );

            // 重置定时器
            jest.useRealTimers();
        });
    });

    describe('generateWorkPlan', () => {
        it('should generate a work plan based on requirement analysis', async () => {
            const analysis: RequirementAnalysis = {
                originalInstruction: 'Create a quiz game',
                parsedRequirements: ['Quiz game with multiple questions'],
                constraints: ['Use TypeScript'],
                goals: ['Create an engaging quiz game']
            };

            // 设置 setTimeout 的模拟
            jest.useFakeTimers();

            // 生成工作计划
            const planPromise = thinkingEngine.generateWorkPlan(projectId, analysis);

            // 快进所有定时器
            jest.runAllTimers();

            // 获取结果
            const workPlan = await planPromise;

            // 验证结果
            expect(workPlan).toBeDefined();
            expect(workPlan.projectId).toBe(projectId);
            expect(workPlan.steps.length).toBeGreaterThan(0);
            expect(workPlan.currentStepIndex).toBe(0);

            // 检查步骤类型是否正确
            workPlan.steps.forEach(step => {
                expect(Object.values(TaskType)).toContain(step.type);
                expect(step.status).toBe('pending');
                expect(step.description).toBeDefined();
            });

            // 验证 WebSocket 事件
            expect(mockWebSocketService.sendAgentThinking).toHaveBeenCalledWith(
                projectId,
                expect.stringContaining('Generating work plan')
            );
            expect(mockWebSocketService.sendAgentAction).toHaveBeenCalledWith(
                projectId,
                expect.objectContaining({
                    type: ActionType.ANALYZE,
                    description: expect.stringContaining('Generated work plan')
                })
            );

            // 重置定时器
            jest.useRealTimers();
        });
    });

    describe('proposeSolution', () => {
        it('should propose a solution for a given problem', async () => {
            const problem: ProblemDetails = {
                description: 'Game rendering is slow',
                possibleCauses: ['Inefficient rendering loop', 'Too many DOM elements']
            };

            // 设置 setTimeout 的模拟
            jest.useFakeTimers();

            // 提出解决方案
            const proposalPromise = thinkingEngine.proposeSolution(projectId, problem);

            // 快进所有定时器
            jest.runAllTimers();

            // 获取结果
            const solution = await proposalPromise;

            // 验证结果
            expect(solution).toBeDefined();
            expect(solution.problemId).toBeDefined();
            expect(solution.proposedSolution).toBeDefined();
            expect(solution.reasoning).toBeDefined();
            expect(solution.estimatedEffort).toBeDefined();
            expect(solution.confidenceScore).toBeGreaterThan(0);
            expect(solution.confidenceScore).toBeLessThanOrEqual(1);

            // 验证 WebSocket 事件
            expect(mockWebSocketService.sendAgentThinking).toHaveBeenCalledWith(
                projectId,
                expect.stringContaining('Thinking about a solution')
            );
            expect(mockWebSocketService.sendAgentAction).toHaveBeenCalledWith(
                projectId,
                expect.objectContaining({
                    type: ActionType.ANALYZE,
                    description: expect.stringContaining('Proposed a solution')
                })
            );

            // 重置定时器
            jest.useRealTimers();
        });
    });

    describe('emitThinkingUpdate', () => {
        it('should emit thinking updates via WebSocket', () => {
            const thinkingMessage = 'Test thinking message';
            const action = {
                type: ActionType.ANALYZE,
                description: 'Test action',
                timestamp: new Date()
            };

            // 调用私有方法
            (thinkingEngine as any).emitThinkingUpdate(projectId, thinkingMessage, action);

            // 验证 WebSocket 事件
            expect(mockWebSocketService.sendAgentThinking).toHaveBeenCalledWith(
                projectId,
                thinkingMessage
            );
            expect(mockWebSocketService.sendAgentAction).toHaveBeenCalledWith(
                projectId,
                action
            );
        });

        it('should work without an action parameter', () => {
            const thinkingMessage = 'Test thinking message without action';

            // 调用私有方法，不带 action 参数
            (thinkingEngine as any).emitThinkingUpdate(projectId, thinkingMessage);

            // 验证 WebSocket 事件
            expect(mockWebSocketService.sendAgentThinking).toHaveBeenCalledWith(
                projectId,
                thinkingMessage
            );
            expect(mockWebSocketService.sendAgentAction).not.toHaveBeenCalled();
        });
    });
});