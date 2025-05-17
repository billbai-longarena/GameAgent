/// <reference types="@testing-library/jest-dom" />
import '@testing-library/jest-dom';
import { WebSocketService } from '@/services/websocket.service';
import { AgentAction, AgentLog, AgentState, DevelopmentStage, LogLevel, ActionType, AgentStatus } from '@/types/agent';
import { File as ProjectFile, FileType } from '@/types/file'; // Renamed to avoid conflict with global File
import * as serverEmitters from '@/lib/websocket/server'; // Import all exports

// Mock the server emitters
jest.mock('@/lib/websocket/server', () => ({
    emitAgentThinking: jest.fn(),
    emitAgentAction: jest.fn(),
    emitAgentProgress: jest.fn(),
    emitAgentLog: jest.fn(),
    emitFileCreated: jest.fn(),
    emitFileUpdated: jest.fn(),
    emitFileDeleted: jest.fn(),
    emitPreviewUpdated: jest.fn(),
    // emitAgentState: jest.fn(), // If we decide to have a dedicated emitter for full state
}));

const mockedEmitters = serverEmitters as jest.Mocked<typeof serverEmitters>;

describe('WebSocketService', () => {
    let service: WebSocketService;
    const projectId = 'test-project-id';

    beforeEach(() => {
        service = new WebSocketService();
        // Reset all mocks before each test
        jest.clearAllMocks();
    });

    it('should call emitAgentThinking with correct parameters', () => {
        const thinking = 'Agent is thinking...';
        service.sendAgentThinking(projectId, thinking);
        expect(mockedEmitters.emitAgentThinking).toHaveBeenCalledTimes(1);
        expect(mockedEmitters.emitAgentThinking).toHaveBeenCalledWith(projectId, { thinking });
    });

    it('should call emitAgentAction with correct parameters', () => {
        const action: AgentAction = { type: ActionType.CREATE_FILE, description: 'Creating a new file', target: 'src/newFile.ts', timestamp: new Date() };
        service.sendAgentAction(projectId, action);
        expect(mockedEmitters.emitAgentAction).toHaveBeenCalledTimes(1);
        expect(mockedEmitters.emitAgentAction).toHaveBeenCalledWith(projectId, { action });
    });

    it('should call emitAgentProgress with correct parameters', () => {
        const stage = DevelopmentStage.CODING;
        const progress = 50;
        const timeRemaining = 300;
        service.sendAgentProgress(projectId, stage, progress, timeRemaining);
        expect(mockedEmitters.emitAgentProgress).toHaveBeenCalledTimes(1);
        expect(mockedEmitters.emitAgentProgress).toHaveBeenCalledWith(projectId, { stage, progress, timeRemaining });
    });

    it('should call emitAgentLog with correct parameters', () => {
        const log: AgentLog = { id: 'log1', message: 'Test log', level: LogLevel.INFO, timestamp: new Date() };
        service.sendAgentLog(projectId, log);
        expect(mockedEmitters.emitAgentLog).toHaveBeenCalledTimes(1);
        expect(mockedEmitters.emitAgentLog).toHaveBeenCalledWith(projectId, { log });
    });

    describe('sendAgentState', () => {
        const mockState: AgentState = {
            id: projectId,
            projectId: projectId,
            currentTask: 'Processing task',
            thinking: 'Deep thought',
            action: { type: ActionType.ANALYZE, description: 'Analyzing data', timestamp: new Date() },
            stage: DevelopmentStage.DESIGN,
            progress: 25,
            status: AgentStatus.THINKING,
            logs: [{ id: 'log-state', message: 'State log', level: LogLevel.DEBUG, timestamp: new Date() }],
            estimatedTimeRemaining: 600,
            thoughtProcess: [],
        };

        it('should call individual emitters when sendAgentState is called', () => {
            service.sendAgentState(projectId, mockState);

            expect(mockedEmitters.emitAgentThinking).toHaveBeenCalledWith(projectId, { thinking: mockState.thinking });
            expect(mockedEmitters.emitAgentProgress).toHaveBeenCalledWith(projectId, {
                stage: mockState.stage,
                progress: mockState.progress,
                timeRemaining: mockState.estimatedTimeRemaining,
            });
            expect(mockedEmitters.emitAgentLog).toHaveBeenCalledWith(projectId, { log: mockState.logs[0] });
            expect(mockedEmitters.emitAgentAction).toHaveBeenCalledWith(projectId, { action: mockState.action });
        });

        it('should not call emitAgentLog if logs array is empty in sendAgentState', () => {
            const stateWithoutLogs: AgentState = { ...mockState, logs: [] };
            service.sendAgentState(projectId, stateWithoutLogs);
            expect(mockedEmitters.emitAgentLog).not.toHaveBeenCalled();
        });
    });


    it('should call emitFileCreated with correct parameters', () => {
        const file: ProjectFile = {
            id: 'file1',
            projectId,
            name: 'test.txt',
            path: 'test.txt',
            type: FileType.DOCUMENT,
            content: 'hello',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        service.sendFileCreated(projectId, file);
        expect(mockedEmitters.emitFileCreated).toHaveBeenCalledTimes(1);
        expect(mockedEmitters.emitFileCreated).toHaveBeenCalledWith(projectId, { file });
    });

    it('should call emitFileUpdated with correct parameters', () => {
        const fileId = 'file1';
        const changes = { diff: '@@ -1,1 +1,1 @@\n-hello\n+world\n' };
        service.sendFileUpdated(projectId, fileId, changes);
        expect(mockedEmitters.emitFileUpdated).toHaveBeenCalledTimes(1);
        expect(mockedEmitters.emitFileUpdated).toHaveBeenCalledWith(projectId, { fileId, changes });
    });

    it('should call emitFileDeleted with correct parameters', () => {
        const fileId = 'file1';
        service.sendFileDeleted(projectId, fileId);
        expect(mockedEmitters.emitFileDeleted).toHaveBeenCalledTimes(1);
        expect(mockedEmitters.emitFileDeleted).toHaveBeenCalledWith(projectId, { fileId });
    });

    it('should call emitPreviewUpdated with correct parameters', () => {
        const url = '/preview/index.html';
        service.sendPreviewUpdated(projectId, url);
        expect(mockedEmitters.emitPreviewUpdated).toHaveBeenCalledTimes(1);
        expect(mockedEmitters.emitPreviewUpdated).toHaveBeenCalledWith(projectId, { url });
    });
});