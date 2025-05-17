/// <reference types="@testing-library/jest-dom" />
/// <reference types="jest" />

import '@testing-library/jest-dom';
import http from 'http';
import { Socket } from 'socket.io';
import { Server } from 'socket.io';
import {
    initWebSocket,
    getIo,
    emitAgentThinking,
    emitAgentAction,
    emitAgentProgress,
    emitAgentLog,
    emitFileCreated,
    emitFileUpdated,
    emitFileDeleted,
    emitPreviewUpdated
} from '@/lib/websocket/server';

// 简单的模拟创建函数
const mockEmitFn = jest.fn();
const mockToFn = jest.fn(() => ({ emit: mockEmitFn }));
const mockOnFn = jest.fn();
const mockOfFn = jest.fn(() => ({
    to: mockToFn,
    emit: mockEmitFn,
    on: mockOnFn
}));

// 预先创建一个模拟Socket对象
const mockSocket = {
    id: 'socket-id',
    handshake: {
        query: { projectId: 'test-project-id' }
    },
    data: {},
    join: jest.fn(),
    on: jest.fn(),
    emit: jest.fn()
};

// 模拟socket.io Server构造函数
jest.mock('socket.io', () => ({
    Server: jest.fn().mockImplementation(() => ({
        of: mockOfFn,
        to: mockToFn,
        emit: mockEmitFn,
        on: mockOnFn
    }))
}));

describe('WebSocket Server', () => {
    let mockServer: http.Server;

    beforeEach(() => {
        // 重置所有模拟
        jest.clearAllMocks();

        // 设置mockOnFn来调用提供的回调函数并传入mockSocket
        mockOnFn.mockImplementation((event, callback) => {
            if (event === 'connection') {
                callback(mockSocket);
            }
        });

        // 创建http.Server模拟
        mockServer = {} as http.Server;

        // 重置全局Socket.io实例
        if (process.env.NODE_ENV !== 'production') {
            (global as any)._ioInstance = undefined;
        }
    });

    afterEach(() => {
        // 清理全局变量
        if (process.env.NODE_ENV !== 'production') {
            (global as any)._ioInstance = undefined;
        }
    });

    describe('initWebSocket', () => {
        it('should initialize a new Socket.io server instance', () => {
            const io = initWebSocket(mockServer);

            // 验证Server构造函数被调用
            expect((Server as jest.Mock).mock.calls.length).toBeGreaterThan(0);

            // 验证io不为undefined
            expect(io !== undefined).toBe(true);

            // 在开发环境中，应该设置全局变量
            if (process.env.NODE_ENV !== 'production') {
                expect((global as any)._ioInstance === io).toBe(true);
            }
        });

        it('should use existing Socket.io server instance if available', () => {
            // 访问Socket.io Server构造函数
            const mockServerConstructor = jest.requireMock('socket.io').Server;

            // 确保全局变量被重置
            (global as any)._ioInstance = undefined;
            jest.clearAllMocks();

            // 先初始化一次
            const firstIo = initWebSocket(mockServer);

            // 记录第一次调用后的调用次数
            const firstCallCount = mockServerConstructor.mock.calls.length;

            // 再次初始化
            const secondIo = initWebSocket(mockServer);

            // 验证两次调用返回相同的实例
            expect(secondIo).toBe(firstIo);

            // 验证第二次调用没有增加构造函数调用次数
            expect(mockServerConstructor.mock.calls.length).toBe(firstCallCount);
        });

        it('should handle connection events correctly', () => {
            // 重置模块状态
            jest.resetModules();
            (global as any)._ioInstance = undefined;

            // 重置所有模拟
            jest.clearAllMocks();

            // 准备一个新的mock socket
            const localMockSocket = {
                id: 'socket-id-test',
                handshake: {
                    query: { projectId: 'test-project-id' }
                },
                data: {},
                join: jest.fn(),
                on: jest.fn(),
                emit: jest.fn()
            };

            // 创建一个局部mock
            const localOnMock = jest.fn((event, callback) => {
                if (event === 'connection') {
                    callback(localMockSocket);
                }
            });

            const localOfMock = jest.fn().mockReturnValue({
                on: localOnMock,
                to: jest.fn().mockReturnValue({ emit: jest.fn() }),
                emit: jest.fn()
            });

            // 重新模拟Socket.io
            const Server = jest.requireMock('socket.io').Server;
            Server.mockImplementation(() => ({
                of: localOfMock,
                to: jest.fn(),
                emit: jest.fn()
            }));

            // 初始化WebSocket
            const { initWebSocket: freshInitWebSocket } = require('@/lib/websocket/server');
            freshInitWebSocket(mockServer);

            // 验证命名空间创建和连接事件监听
            expect(localOfMock).toHaveBeenCalledWith('/agent');
            expect(localOnMock).toHaveBeenCalledWith('connection', expect.any(Function));

            // 验证socket.join被调用
            expect(localMockSocket.join).toHaveBeenCalledWith(`project:${localMockSocket.handshake.query.projectId}`);
        });
    });

    describe('getIo', () => {
        it('should return the initialized socket.io instance', () => {
            const io = initWebSocket(mockServer);
            const retrievedIo = getIo();

            expect(retrievedIo === io).toBe(true);
        });

        it('should throw an error if socket.io is not initialized', () => {
            // 完全清除模块和全局实例
            jest.resetModules();
            (global as any)._ioInstance = undefined;

            // 使用函数包装器测试异常
            let thrownError: Error | null = null;
            try {
                // 重新导入getIo
                const { getIo: freshGetIo } = require('@/lib/websocket/server');
                freshGetIo();
            } catch (error) {
                thrownError = error as Error;
            }

            // 验证错误被抛出并且包含期望的消息
            expect(thrownError).not.toBeNull();
            expect(thrownError?.message).toContain('Socket.io not initialized');
        });
    });

    describe('emit functions', () => {
        const projectId = 'test-project';

        beforeEach(() => {
            // 重置模拟并初始化websocket服务器
            jest.clearAllMocks();
            initWebSocket(mockServer);
        });

        it('should emit agent thinking events', () => {
            // 准备测试数据
            const thinkingData = { thinking: 'Test thinking' };

            // 执行函数
            emitAgentThinking(projectId, thinkingData);

            // 验证调用
            expect(mockOfFn).toHaveBeenCalledWith('/agent');
            expect(mockToFn).toHaveBeenCalledWith(`project:${projectId}`);
            expect(mockEmitFn).toHaveBeenCalledWith('agent:thinking', {
                projectId,
                thinking: 'Test thinking'
            });
        });

        it('should emit agent action events', () => {
            const actionData = { action: { type: 'test', description: 'Test action' } };
            emitAgentAction(projectId, actionData);

            expect(mockOfFn).toHaveBeenCalledWith('/agent');
            expect(mockToFn).toHaveBeenCalledWith(`project:${projectId}`);
            expect(mockEmitFn).toHaveBeenCalledWith('agent:action', {
                projectId,
                action: actionData.action
            });
        });

        it('should emit agent progress events', () => {
            const progressData = { stage: 'coding', progress: 50, timeRemaining: 300 };
            emitAgentProgress(projectId, progressData);

            expect(mockOfFn).toHaveBeenCalledWith('/agent');
            expect(mockToFn).toHaveBeenCalledWith(`project:${projectId}`);
            expect(mockEmitFn).toHaveBeenCalledWith('agent:progress', {
                projectId,
                ...progressData
            });
        });

        it('should emit agent log events', () => {
            const logData = { log: { message: 'Test log', level: 'info' } };
            emitAgentLog(projectId, logData);

            expect(mockOfFn).toHaveBeenCalledWith('/agent');
            expect(mockToFn).toHaveBeenCalledWith(`project:${projectId}`);
            expect(mockEmitFn).toHaveBeenCalledWith('agent:log', {
                projectId,
                log: logData.log
            });
        });

        it('should emit file created events', () => {
            const fileData = { file: { id: 'file-1', name: 'test.js', content: 'Test content' } };
            emitFileCreated(projectId, fileData);

            expect(mockOfFn).toHaveBeenCalledWith('/agent');
            expect(mockToFn).toHaveBeenCalledWith(`project:${projectId}`);
            expect(mockEmitFn).toHaveBeenCalledWith('file:created', {
                projectId,
                file: fileData.file
            });
        });

        it('should emit file updated events', () => {
            const updateData = { fileId: 'file-1', changes: { content: 'Updated content' } };
            emitFileUpdated(projectId, updateData);

            expect(mockOfFn).toHaveBeenCalledWith('/agent');
            expect(mockToFn).toHaveBeenCalledWith(`project:${projectId}`);
            expect(mockEmitFn).toHaveBeenCalledWith('file:updated', {
                projectId,
                fileId: updateData.fileId,
                changes: updateData.changes
            });
        });

        it('should emit file deleted events', () => {
            const deleteData = { fileId: 'file-1' };
            emitFileDeleted(projectId, deleteData);

            expect(mockOfFn).toHaveBeenCalledWith('/agent');
            expect(mockToFn).toHaveBeenCalledWith(`project:${projectId}`);
            expect(mockEmitFn).toHaveBeenCalledWith('file:deleted', {
                projectId,
                fileId: deleteData.fileId
            });
        });

        it('should emit preview updated events', () => {
            const previewData = { url: '/preview/test.html' };
            emitPreviewUpdated(projectId, previewData);

            expect(mockOfFn).toHaveBeenCalledWith('/agent');
            expect(mockToFn).toHaveBeenCalledWith(`project:${projectId}`);
            expect(mockEmitFn).toHaveBeenCalledWith('preview:updated', {
                projectId,
                url: previewData.url
            });
        });
    });
});