import { Server, Socket } from 'socket.io';
import http from 'http';
import { GameListItem } from '@/types/game'; // Import GameListItem

// 定义可以从 WebSocket 服务发出的事件类型
// 这些事件与 design.md 中定义的事件相对应
export interface ServerToClientEvents {
    'agent:thinking': (data: { projectId: string; thinking: string }) => void;
    'agent:action': (data: { projectId: string; action: any }) => void; // 'any' 应替换为更具体的 AgentAction 类型
    'agent:progress': (data: {
        projectId: string;
        stage: string; // 'string' 应替换为更具体的 DevelopmentStage 类型
        progress: number;
        timeRemaining: number;
    }) => void;
    'agent:log': (data: { projectId: string; log: any }) => void; // 'any' 应替换为更具体的 AgentLog 类型
    'file:created': (data: { projectId: string; file: any }) => void; // 'any' 应替换为更具体的 File 类型
    'file:updated': (data: {
        projectId: string;
        fileId: string;
        changes: any; // 'any' 应替换为更具体的变更类型
    }) => void;
    'file:deleted': (data: { projectId: string; fileId: string }) => void;
    'preview:updated': (data: { projectId: string; url: string }) => void;
    'game:generated': (data: { projectId: string; game: GameListItem }) => void; // Added game generated event
}

// 定义客户端可以发送到 WebSocket 服务的事件类型
// 目前设计文档中没有明确客户端主动发送的事件，但保留以备将来扩展
export interface ClientToServerEvents {
    // hello: () => void;
}

// 定义内部服务器事件，例如连接、断开连接等
export interface InterServerEvents {
    // ping: () => void;
}

// 定义 socket 实例的数据结构，可以用于存储与特定 socket 相关的信息
export interface SocketData {
    projectId?: string;
}

// 全局 WebSocket IO 实例
let io: Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
> | undefined; // 明确可以是 undefined

// Helper to get the global instance in dev mode
const getGlobalIo = (): Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData> | undefined => {
    if (process.env.NODE_ENV !== 'production') {
        return (global as any)._ioInstance;
    }
    return undefined;
};

// Helper to set the global instance in dev mode
const setGlobalIo = (instance: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>) => {
    if (process.env.NODE_ENV !== 'production') {
        (global as any)._ioInstance = instance;
    }
};

export const initWebSocket = (
    server: http.Server
): Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
> => {
    const globalIoInstance = getGlobalIo();
    if (globalIoInstance) {
        io = globalIoInstance; // Sync module-level io with global
        return globalIoInstance;
    }

    // 如果模块级 io 已经存在 (不太可能在 HMR 场景下先于 globalIoInstance)
    if (io) {
        setGlobalIo(io); // Ensure global is also set if module scope somehow survived
        return io;
    }

    const newIoInstance = new Server<
        ClientToServerEvents,
        ServerToClientEvents,
        InterServerEvents,
        SocketData
    >(server, {
        // 配置 CORS，允许来自 Next.js 开发服务器的连接
        // 在生产环境中，应配置为实际的前端域名
        cors: {
            origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
            methods: ['GET', 'POST'],
        },
    });

    const agentNamespace = newIoInstance.of('/agent');

    agentNamespace.on('connection', (socket: Socket) => {
        const projectId = socket.handshake.query.projectId as string;

        if (projectId) {
            socket.data.projectId = projectId;
            const roomName = `project:${projectId}`;
            socket.join(roomName);
            // 可以发送一个确认连接的消息
            // socket.emit('connected', { message: `Successfully connected to project ${projectId}` });
        }

        socket.on('disconnect', (reason) => {
            // 客户端断开连接时会自动离开其加入的所有房间
        });

        // 在这里可以添加其他特定于命名空间的事件监听器
        // 例如，如果客户端需要发送消息到服务器
        // socket.on('clientEvent', (data) => {
        //   // 处理事件，可能需要广播到房间内的其他客户端
        //   if (socket.data.projectId) {
        //     agentNamespace.to(`project:${socket.data.projectId}`).emit('serverEvent', { from: socket.id, data });
        //   }
        // });
    });

    io = newIoInstance; // Set module-level io
    setGlobalIo(io);    // Set global-level io for dev HMR
    return io;
};

// 获取 IO 实例的函数，以便在项目的其他部分使用
export const getIo = (): Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
> => {
    const globalIoInstance = getGlobalIo();
    if (globalIoInstance) {
        // If module 'io' is out of sync (e.g. after HMR re-evaluation of the module), re-sync it.
        if (io !== globalIoInstance) {
            io = globalIoInstance;
        }
        return globalIoInstance;
    }

    // Fallback for production or if globalIoInstance is not set
    if (!io) {
        // This path should ideally not be hit if initWebSocket was called correctly.
        // If it is hit in dev, it means global._ioInstance was also not set or lost.
        throw new Error(
            'Socket.io not initialized. Call initWebSocket(server) first and ensure it persists.'
        );
    }
    return io;
};

// 导出一个函数，用于向特定项目的房间广播事件
// 这些函数将在 websocket.service.ts 中使用
export const emitAgentThinking = (
    projectId: string,
    data: { thinking: string }
) => {
    getIo()
        .of('/agent')
        .to(`project:${projectId}`)
        .emit('agent:thinking', { projectId, ...data });
};

export const emitAgentAction = (
    projectId: string,
    data: { action: any } // 替换为 AgentAction 类型
) => {
    getIo()
        .of('/agent')
        .to(`project:${projectId}`)
        .emit('agent:action', { projectId, ...data });
};

export const emitAgentProgress = (
    projectId: string,
    data: { stage: string; progress: number; timeRemaining: number } // 替换为 DevelopmentStage 类型
) => {
    getIo()
        .of('/agent')
        .to(`project:${projectId}`)
        .emit('agent:progress', { projectId, ...data });
};

export const emitAgentLog = (
    projectId: string,
    data: { log: any } // 替换为 AgentLog 类型
) => {
    getIo()
        .of('/agent')
        .to(`project:${projectId}`)
        .emit('agent:log', { projectId, ...data });
};

export const emitFileCreated = (
    projectId: string,
    data: { file: any } // 替换为 File 类型
) => {
    getIo()
        .of('/agent')
        .to(`project:${projectId}`)
        .emit('file:created', { projectId, ...data });
};

export const emitFileUpdated = (
    projectId: string,
    data: { fileId: string; changes: any } // 替换为更具体的变更类型
) => {
    getIo()
        .of('/agent')
        .to(`project:${projectId}`)
        .emit('file:updated', { projectId, ...data });
};

export const emitFileDeleted = (
    projectId: string,
    data: { fileId: string }
) => {
    getIo()
        .of('/agent')
        .to(`project:${projectId}`)
        .emit('file:deleted', { projectId, ...data });
};

export const emitPreviewUpdated = (
    projectId: string,
    data: { url: string }
) => {
    getIo()
        .of('/agent')
        .to(`project:${projectId}`)
        .emit('preview:updated', { projectId, ...data });
};

export const emitGameGenerated = (
    projectId: string,
    data: { game: GameListItem }
) => {
    getIo()
        .of('/agent')
        .to(`project:${projectId}`)
        .emit('game:generated', { projectId, ...data });
};
