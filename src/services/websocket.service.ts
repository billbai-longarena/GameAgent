import {
    emitAgentThinking,
    emitAgentAction,
    emitAgentProgress,
    emitAgentLog,
    emitFileCreated,
    emitFileUpdated,
    emitFileDeleted,
    emitPreviewUpdated,
} from '../lib/websocket/server';
import { AgentAction, AgentLog, AgentState, DevelopmentStage } from '@/types/agent';
import { File } from '@/types/file'; // Assuming File type is defined in @/types/file

export class WebSocketService {
    constructor() {
        // Constructor can be used for initialization if needed in the future
    }

    /**
     * 发送 Agent 思考过程更新事件。
     * @param projectId 项目ID。
     * @param thinking Agent 的当前思考内容。
     */
    public sendAgentThinking(projectId: string, thinking: string): void {
        emitAgentThinking(projectId, { thinking });
    }

    /**
     * 发送 Agent 执行操作事件。
     * @param projectId 项目ID。
     * @param action Agent 执行的操作详情。
     */
    public sendAgentAction(projectId: string, action: AgentAction): void {
        emitAgentAction(projectId, { action });
    }

    /**
     * 发送 Agent 进度更新事件。
     * @param projectId 项目ID。
     * @param stage 当前开发阶段。
     * @param progress 当前进度百分比。
     * @param timeRemaining 预计剩余时间（秒）。
     */
    public sendAgentProgress(
        projectId: string,
        stage: DevelopmentStage,
        progress: number,
        timeRemaining: number
    ): void {
        emitAgentProgress(projectId, { stage, progress, timeRemaining });
    }

    /**
     * 发送 Agent 日志消息事件。
     * @param projectId 项目ID。
     * @param log 日志消息详情。
     */
    public sendAgentLog(projectId: string, log: AgentLog): void {
        emitAgentLog(projectId, { log });
    }

    /**
     * 发送 Agent 整体状态更新事件。
     * @param projectId 项目ID。
     * @param state Agent 的当前完整状态。
     */
    public sendAgentState(projectId: string, state: AgentState): void {
        // Assuming there's an emitter for the entire agent state
        // If not, this might need a new emitter in server.ts or send individual parts.
        // For now, let's assume a generic 'agent:state' event or similar.
        // This is a common pattern, but if not present, AgentController will call individual emitters.
        // For the purpose of this refactor, we'll add a placeholder for a direct state emit.
        // If no direct state emitter exists, AgentController should call sendAgentThinking, sendAgentProgress, etc.
        console.log(`WebSocketService: Emitting full agent state for project ${projectId}`, state);
        // Placeholder: emitAgentState(projectId, state);
        // As a fallback if no single state emitter:
        this.sendAgentThinking(projectId, state.thinking);
        this.sendAgentProgress(projectId, state.stage, state.progress, state.estimatedTimeRemaining);
        if (state.logs.length > 0) {
            this.sendAgentLog(projectId, state.logs[state.logs.length - 1]); // Send the latest log
        }
        this.sendAgentAction(projectId, state.action);

    }


    /**
     * 发送文件创建通知事件。
     * @param projectId 项目ID。
     * @param file 创建的文件详情。
     */
    public sendFileCreated(projectId: string, file: File): void {
        emitFileCreated(projectId, { file });
    }

    /**
     * 发送文件更新通知事件。
     * @param projectId 项目ID。
     * @param fileId 更新的文件ID。
     * @param changes 文件的具体变更内容。
     */
    public sendFileUpdated(
        projectId: string,
        fileId: string,
        changes: any // Consider defining a specific type for changes
    ): void {
        emitFileUpdated(projectId, { fileId, changes });
    }

    /**
     * 发送文件删除通知事件。
     * @param projectId 项目ID。
     * @param fileId 被删除的文件ID。
     */
    public sendFileDeleted(projectId: string, fileId: string): void {
        emitFileDeleted(projectId, { fileId });
    }

    /**
     * 发送游戏预览更新通知事件。
     * @param projectId 项目ID。
     * @param url 新的预览URL。
     */
    public sendPreviewUpdated(projectId: string, url: string): void {
        emitPreviewUpdated(projectId, { url });
    }
}

// 注意：
// 1. 类型占位符 'any' (用于 changes) 应该根据项目中定义的具体类型进行替换。
//    这有助于类型安全和代码可维护性。
// 2. 这个类封装了 server.ts 中的 emit 函数。
//    未来可以根据需要在这里添加额外的逻辑，例如参数校验、数据转换等。
