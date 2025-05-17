/// <reference types="@testing-library/jest-dom" />
/// <reference types="jest" />

import '@testing-library/jest-dom';
import { AIService } from '@/services/ai.service';
import { FileService } from '@/services/file.service';
import { WebSocketService } from '@/services/websocket.service';
import { ProjectService } from '@/services/project.service';
import { AgentStatus, ActionType, LogLevel } from '@/types/agent';
import { DevelopmentStage, ProjectStatus } from '@/types/project';
import { ThinkingEngine } from '@/lib/agent/thinking';
import { ExecutionEngine } from '@/lib/agent/execution';

// 假设存在 AgentController 类，如果不存在，需要创建
// 这个类负责协调 ThinkingEngine 和 ExecutionEngine
class AgentController {
    private projectId: string;
    private thinkingEngine: ThinkingEngine;
    private executionEngine: ExecutionEngine;
    private aiService: AIService;
    private fileService: FileService;
    private webSocketService: WebSocketService;
    private projectService: ProjectService;
    private status: AgentStatus = AgentStatus.IDLE;
    private logs: any[] = [];

    constructor(
        projectId: string,
        thinkingEngine: ThinkingEngine,
        executionEngine: ExecutionEngine,
        aiService: AIService,
        fileService: FileService,
        webSocketService: WebSocketService,
        projectService: ProjectService
    ) {
        this.projectId = projectId;
        this.thinkingEngine = thinkingEngine;
        this.executionEngine = executionEngine;
        this.aiService = aiService;
        this.fileService = fileService;
        this.webSocketService = webSocketService;
        this.projectService = projectService;
    }

    async start(instruction: string): Promise<boolean> {
        this.status = AgentStatus.THINKING;
        this.addLog("Agent started processing instruction", LogLevel.INFO);
        this.webSocketService.sendAgentAction(this.projectId, {
            type: ActionType.INITIALIZE,
            description: "Agent started processing instruction",
            timestamp: new Date()
        });

        try {
            // 1. 分析需求
            const analysis = await this.thinkingEngine.analyzeRequirement(this.projectId, instruction);

            // 2. 生成工作计划
            const workPlan = await this.thinkingEngine.generateWorkPlan(this.projectId, analysis);

            // 3. 执行工作计划
            this.status = AgentStatus.CODING;
            const success = await this.executionEngine.executeWorkPlan(workPlan);

            // 4. 更新项目状态
            await this.projectService.updateProject(this.projectId, {
                status: success ? ProjectStatus.COMPLETED : ProjectStatus.ERROR,
                currentStage: DevelopmentStage.COMPLETED,
                progress: success ? 100 : 0
            });

            this.status = success ? AgentStatus.COMPLETED : AgentStatus.ERROR;
            this.addLog(`Agent ${success ? 'completed' : 'failed'} the task`, success ? LogLevel.INFO : LogLevel.ERROR);

            return success;
        } catch (error) {
            this.status = AgentStatus.ERROR;
            this.addLog(`Agent failed: ${error instanceof Error ? error.message : String(error)}`, LogLevel.ERROR);
            return false;
        }
    }

    stop(): void {
        this.status = AgentStatus.IDLE;
        this.addLog("Agent stopped", LogLevel.INFO);
        this.webSocketService.sendAgentAction(this.projectId, {
            type: ActionType.IDLE,
            description: "Agent stopped",
            timestamp: new Date()
        });
    }

    getStatus(): AgentStatus {
        return this.status;
    }

    getLogs(): any[] {
        return [...this.logs];
    }

    private addLog(message: string, level: LogLevel, context?: any): void {
        const log = {
            id: crypto.randomUUID(),
            message,
            level,
            timestamp: new Date(),
            context
        };
        this.logs.push(log);
        this.webSocketService.sendAgentLog(this.projectId, log);
    }
}

// 模拟依赖
jest.mock('@/services/ai.service');
jest.mock('@/services/file.service');
jest.mock('@/services/websocket.service');
jest.mock('@/services/project.service');
jest.mock('@/lib/agent/thinking');
jest.mock('@/lib/agent/execution');

describe('AgentController', () => {
    let agentController: AgentController;
    let mockThinkingEngine: jest.Mocked<ThinkingEngine>;
    let mockExecutionEngine: jest.Mocked<ExecutionEngine>;
    let mockAIService: jest.Mocked<AIService>;
    let mockFileService: jest.Mocked<FileService>;
    let mockWebSocketService: jest.Mocked<WebSocketService>;
    let mockProjectService: jest.Mocked<ProjectService>;
    const projectId = 'test-project-id';

    beforeEach(() => {
        jest.resetAllMocks();

        // 创建模拟的依赖实例
        mockThinkingEngine = new ThinkingEngine(null as any, null as any) as jest.Mocked<ThinkingEngine>;
        mockExecutionEngine = new ExecutionEngine(null as any, null as any, null as any) as jest.Mocked<ExecutionEngine>;
        mockAIService = new AIService() as jest.Mocked<AIService>;
        mockFileService = new FileService() as jest.Mocked<FileService>;
        mockWebSocketService = new WebSocketService() as jest.Mocked<WebSocketService>;
        mockProjectService = new ProjectService() as jest.Mocked<ProjectService>;

        // 模拟方法
        mockWebSocketService.sendAgentAction = jest.fn();
        mockWebSocketService.sendAgentLog = jest.fn();
        mockThinkingEngine.analyzeRequirement = jest.fn().mockResolvedValue({
            originalInstruction: 'Test instruction',
            parsedRequirements: ['Requirement 1'],
            constraints: ['Constraint 1'],
            goals: ['Goal 1']
        });
        mockThinkingEngine.generateWorkPlan = jest.fn().mockResolvedValue({
            id: 'plan-1',
            projectId,
            overallGoal: 'Test goal',
            steps: [
                { id: 'step-1', type: 'create_file', description: 'Create file', status: 'pending' }
            ],
            currentStepIndex: 0
        });
        mockExecutionEngine.executeWorkPlan = jest.fn().mockResolvedValue(true);
        mockProjectService.updateProject = jest.fn().mockResolvedValue({});

        // 初始化控制器
        agentController = new AgentController(
            projectId,
            mockThinkingEngine,
            mockExecutionEngine,
            mockAIService,
            mockFileService,
            mockWebSocketService,
            mockProjectService
        );
    });

    describe('start', () => {
        it('should process instruction and execute work plan successfully', async () => {
            const instruction = 'Create a quiz game';
            const result = await agentController.start(instruction);

            // 验证结果
            expect(result).toBe(true);
            expect(agentController.getStatus()).toBe(AgentStatus.COMPLETED);

            // 验证方法调用
            expect(mockThinkingEngine.analyzeRequirement).toHaveBeenCalledWith(projectId, instruction);
            expect(mockThinkingEngine.generateWorkPlan).toHaveBeenCalled();
            expect(mockExecutionEngine.executeWorkPlan).toHaveBeenCalled();
            expect(mockProjectService.updateProject).toHaveBeenCalledWith(
                projectId,
                expect.objectContaining({
                    status: ProjectStatus.COMPLETED,
                    currentStage: DevelopmentStage.COMPLETED,
                    progress: 100
                })
            );

            // 验证日志和WebSocket事件
            expect(mockWebSocketService.sendAgentAction).toHaveBeenCalledWith(
                projectId,
                expect.objectContaining({
                    type: ActionType.INITIALIZE
                })
            );
            expect(mockWebSocketService.sendAgentLog).toHaveBeenCalled();
            expect(agentController.getLogs().length).toBeGreaterThan(0);
        });

        it('should handle execution failure', async () => {
            mockExecutionEngine.executeWorkPlan = jest.fn().mockResolvedValue(false);

            const instruction = 'Create a quiz game';
            const result = await agentController.start(instruction);

            // 验证结果
            expect(result).toBe(false);
            expect(agentController.getStatus()).toBe(AgentStatus.ERROR);

            // 验证更新项目状态的调用
            expect(mockProjectService.updateProject).toHaveBeenCalledWith(
                projectId,
                expect.objectContaining({
                    status: ProjectStatus.ERROR,
                    progress: 0
                })
            );
        });

        it('should handle exceptions during processing', async () => {
            mockThinkingEngine.analyzeRequirement = jest.fn().mockRejectedValue(new Error('Test error'));

            const instruction = 'Create a quiz game';
            const result = await agentController.start(instruction);

            // 验证结果
            expect(result).toBe(false);
            expect(agentController.getStatus()).toBe(AgentStatus.ERROR);

            // 验证错误日志
            const logs = agentController.getLogs();
            const errorLog = logs.find(log => log.level === LogLevel.ERROR);
            expect(errorLog).toBeDefined();
            expect(errorLog.message).toContain('Test error');
        });
    });

    describe('stop', () => {
        it('should stop the agent and update status', () => {
            // 先启动代理
            agentController.start('Test instruction');

            // 停止代理
            agentController.stop();

            // 验证状态更新
            expect(agentController.getStatus()).toBe(AgentStatus.IDLE);

            // 验证WebSocket事件
            expect(mockWebSocketService.sendAgentAction).toHaveBeenCalledWith(
                projectId,
                expect.objectContaining({
                    type: ActionType.IDLE,
                    description: 'Agent stopped'
                })
            );

            // 验证日志
            const logs = agentController.getLogs();
            const stopLog = logs.find(log => log.message === 'Agent stopped');
            expect(stopLog).toBeDefined();
        });
    });

    describe('getStatus', () => {
        it('should return the current agent status', () => {
            // 初始状态
            expect(agentController.getStatus()).toBe(AgentStatus.IDLE);

            // 启动后状态
            agentController.start('Test instruction');
            expect(agentController.getStatus()).toBe(AgentStatus.THINKING);
        });
    });

    describe('getLogs', () => {
        it('should return all logs', () => {
            // 初始日志为空
            expect(agentController.getLogs()).toEqual([]);

            // 添加一些日志
            agentController.start('Test instruction');
            agentController.stop();

            // 验证日志已添加
            const logs = agentController.getLogs();
            expect(logs.length).toBeGreaterThan(0);
            expect(logs[0].message).toBe('Agent started processing instruction');
        });
    });
});