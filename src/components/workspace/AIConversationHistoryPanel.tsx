'use client';

import React, { useState, useRef, useEffect } from 'react';
import { AgentState, ThoughtStep, ActionType, LogLevel, AgentLog } from '@/types/agent';
import { FileChange } from '@/types/file';
import { format } from 'date-fns';
import ClientTimestamp from '@/components/common/ClientTimestamp';
import NaturalLanguageInput from '@/components/input/NaturalLanguageInput';
import { FiCopy } from 'react-icons/fi';

interface AIConversationHistoryPanelProps {
    agentState?: AgentState | null;
    fileChanges?: FileChange[];
    onSendMessage?: (message: string) => void;
}

// 日志类型枚举
enum LogEntryType {
    THINKING = 'thinking',
    ACTION = 'action',
    FILE_CHANGE = 'file_change'
}

// 统一的日志条目接口
interface LogEntry {
    id: string;
    type: LogEntryType;
    timestamp: string;
    content: any; // ThoughtStep | AgentLog | FileChange
}

const AIConversationHistoryPanel: React.FC<AIConversationHistoryPanelProps> = ({
    agentState,
    fileChanges = [],
    onSendMessage
}) => {
    // Helper function to get stage icon for copying
    const getStageIconForCopy = (stage: ThoughtStep['stage']): string => {
        if (typeof stage === 'string') {
            if (stage.includes('Definition')) return '❓';
            if (stage.includes('Gathering')) return '🔍';
            if (stage.includes('Design')) return '🎨';
            if (stage.includes('Planning')) return '📅';
            if (stage.includes('Execution') || stage.includes('Coding')) return '⚙️';
            if (stage.includes('Generation')) return '✨';
            if (stage.includes('Evaluation') || stage.includes('Testing')) return '🧪';
            if (stage.includes('Refinement') || stage.includes('Optimization')) return '🔧';
            if (stage.includes('Completed')) return '✅';
        }
        return '🧠';
    };

    // Helper function to get operation icon for copying
    const getOperationIconForCopy = (operation: FileChange['operation']): string => {
        switch (operation) {
            case 'create': return '📄+';
            case 'update': return '✏️';
            case 'delete': return '🗑️';
            default: return '⚙️';
        }
    };


    const formatThinkingLogForCopy = (thought: ThoughtStep): string => {
        let content = `[思考过程 | ${thought.status.toUpperCase()} | ${format(new Date(thought.timestamp), 'yyyy-MM-dd HH:mm:ss')}]\n`;
        const stageIcon = getStageIconForCopy(thought.stage);
        content += `${stageIcon} [${typeof thought.stage === 'string' ? thought.stage : 'Step'}]: ${thought.description}\n`;
        if (thought.details) {
            content += `详细信息:\n${typeof thought.details === 'string' ? thought.details : JSON.stringify(thought.details, null, 2)}\n`;
        }
        if (thought.decision) {
            content += `决策: ${thought.decision}\n`;
        }
        if (thought.alternativesConsidered && thought.alternativesConsidered.length > 0) {
            content += `考虑的替代方案: ${thought.alternativesConsidered.join(', ')}\n`;
        }
        return content.trim();
    };

    const formatActionLogForCopy = (logEntry: AgentLog): string => {
        let content = `[执行操作 | ${logEntry.level.toUpperCase()} | ${format(new Date(logEntry.timestamp), 'yyyy-MM-dd HH:mm:ss')}] ${logEntry.message}\n`;
        if (logEntry.context) {
            content += `上下文:\n${typeof logEntry.context === 'string' ? logEntry.context : JSON.stringify(logEntry.context, null, 2)}\n`;
        }
        return content.trim();
    };

    const formatFileChangeLogForCopy = (fileChange: FileChange): string => {
        const operationIcon = getOperationIconForCopy(fileChange.operation);
        let content = `[文件变更 | ${fileChange.operation.toUpperCase()} | ${operationIcon} | ${fileChange.timestamp ? format(new Date(fileChange.timestamp), 'yyyy-MM-dd HH:mm:ss') : 'N/A'}]\n`;
        content += `文件: ${fileChange.file.path || fileChange.file.name || 'Unknown file'}\n`;
        if (fileChange.diff) {
            content += `变更详情:\n${fileChange.diff}\n`;
        }
        if (!fileChange.timestamp && fileChange.file.updatedAt) {
            content += `文件更新时间: ${format(new Date(fileChange.file.updatedAt), 'yyyy-MM-dd HH:mm:ss')}\n`;
        }
        return content.trim();
    };

    // 将思考步骤转换为日志条目
    const thoughtLogs: LogEntry[] = (agentState?.thoughtProcess || []).map(thought => ({
        id: thought.id,
        type: LogEntryType.THINKING,
        timestamp: thought.timestamp,
        content: thought
    }));

    // 将执行操作转换为日志条目
    const actionLogs: LogEntry[] = (agentState?.logs || []).map(log => ({
        id: log.id,
        type: LogEntryType.ACTION,
        timestamp: log.timestamp.toString(),
        content: log
    }));

    // 将文件变更转换为日志条目
    const fileLogs: LogEntry[] = fileChanges.map(change => ({
        id: change.id || `file-${Math.random().toString(36).substr(2, 9)}`,
        type: LogEntryType.FILE_CHANGE,
        timestamp: change.timestamp,
        content: change
    }));

    // 合并所有日志并按时间排序
    const allLogs: LogEntry[] = [...thoughtLogs, ...actionLogs, ...fileLogs].sort((a, b) => {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    const isProcessing = agentState?.status !== 'idle' &&
        agentState?.status !== 'completed' &&
        agentState?.status !== 'paused' &&
        agentState?.status !== 'error';

    const handleCopyAll = async () => {
        let textToCopy = "";
        const logsToProcess = [...allLogs].reverse(); // Chronological order

        for (const log of logsToProcess) {
            switch (log.type) {
                case LogEntryType.THINKING:
                    textToCopy += formatThinkingLogForCopy(log.content as ThoughtStep) + "\n\n---\n\n";
                    break;
                case LogEntryType.ACTION:
                    textToCopy += formatActionLogForCopy(log.content as AgentLog) + "\n\n---\n\n";
                    break;
                case LogEntryType.FILE_CHANGE:
                    textToCopy += formatFileChangeLogForCopy(log.content as FileChange) + "\n\n---\n\n";
                    break;
            }
        }

        try {
            await navigator.clipboard.writeText(textToCopy.trim());
            alert('AI状态栏内容已复制到剪贴板!');
        } catch (err) {
            console.error('无法复制内容: ', err);
            alert('复制失败!');
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-800 text-gray-200 rounded-lg shadow-lg overflow-x-hidden">
            {/* 主面板 */}
            {/* 移除 ref 和 style 以允许外部 flex 控制宽度 */}
            <div
                className="flex flex-col h-full w-full" // 确保它填充父容器给定的空间
            >
                <div className="flex justify-between items-center border-b border-gray-700 pb-2 px-4 pt-4 mb-3">
                    <h3 className="text-xl font-semibold text-gray-100">
                        AI状态栏
                    </h3>
                    <button
                        onClick={handleCopyAll}
                        title="复制所有日志"
                        className="p-1 text-gray-400 hover:text-gray-100 hover:bg-gray-700 rounded-md transition-colors"
                        aria-label="复制所有日志"
                    >
                        <FiCopy size={18} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-4">
                    {allLogs.length === 0 && (
                        <p className="text-gray-400 italic">暂无对话历史记录...</p>
                    )}

                    <div className="space-y-3 pb-4 max-w-full overflow-x-hidden">
                        {allLogs.map((log) => (
                            <LogEntryItem key={log.id} log={log} />
                        ))}
                    </div>
                </div>

                {/* 添加输入框和发送按钮 */}
                {onSendMessage && (
                    <div className="mt-auto border-t border-gray-700 p-4">
                        <div className="flex items-start space-x-2">
                            <textarea
                                placeholder="输入您的指令..."
                                className="flex-grow p-2 text-sm bg-gray-700 border border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 resize-none placeholder-gray-400"
                                rows={2}
                                disabled={!!isProcessing}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        const target = e.target as HTMLTextAreaElement;
                                        if (target.value.trim() && !isProcessing) {
                                            onSendMessage(target.value.trim());
                                            target.value = '';
                                        }
                                    }
                                }}
                            />
                            <button
                                onClick={(e) => {
                                    const textarea = e.currentTarget.previousElementSibling as HTMLTextAreaElement;
                                    if (textarea && textarea.value.trim() && !isProcessing) {
                                        onSendMessage(textarea.value.trim());
                                        textarea.value = '';
                                    }
                                }}
                                disabled={!!isProcessing}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-800 disabled:bg-gray-500 disabled:cursor-not-allowed"
                            >
                                发送
                            </button>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                            <span className="text-xs text-gray-400 pt-1 self-center">快捷指令:</span>
                            <button
                                onClick={(e) => {
                                    const textarea = e.currentTarget.parentElement?.previousElementSibling?.querySelector('textarea') as HTMLTextAreaElement;
                                    if (textarea) {
                                        textarea.value = '创建新游戏';
                                        textarea.focus();
                                    }
                                }}
                                disabled={!!isProcessing}
                                className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-500 rounded disabled:bg-gray-700 disabled:text-gray-500"
                            >
                                创建新游戏
                            </button>
                            <button
                                onClick={(e) => {
                                    const textarea = e.currentTarget.parentElement?.previousElementSibling?.querySelector('textarea') as HTMLTextAreaElement;
                                    if (textarea) {
                                        textarea.value = '解释代码';
                                        textarea.focus();
                                    }
                                }}
                                disabled={!!isProcessing}
                                className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-500 rounded disabled:bg-gray-700 disabled:text-gray-500"
                            >
                                解释代码
                            </button>
                        </div>
                    </div>
                )}
            </div>
            {/* 移除了拖动手柄 */}
        </div>
    );
};

// 日志条目组件
const LogEntryItem: React.FC<{ log: LogEntry }> = ({ log }) => {
    switch (log.type) {
        case LogEntryType.THINKING:
            return <ThinkingLogItem thought={log.content as ThoughtStep} />;
        case LogEntryType.ACTION:
            return <ActionLogItem action={log.content} />;
        case LogEntryType.FILE_CHANGE:
            return <FileChangeLogItem fileChange={log.content as FileChange} />;
        default:
            return null;
    }
};

// 思考过程日志条目
const ThinkingLogItem: React.FC<{ thought: ThoughtStep }> = ({ thought }) => {
    const getStatusColor = (status: ThoughtStep['status']): string => {
        switch (status) {
            case 'completed': return 'text-green-400';
            case 'in-progress': return 'text-yellow-400';
            case 'failed': return 'text-red-400';
            case 'pending': return 'text-gray-400';
            case 'skipped': return 'text-gray-500';
            case 'info': return 'text-blue-400';
            default: return 'text-gray-300';
        }
    };

    const getStageIcon = (stage: ThoughtStep['stage']): string => {
        if (typeof stage === 'string') {
            if (stage.includes('Definition')) return '❓';
            if (stage.includes('Gathering')) return '🔍';
            if (stage.includes('Design')) return '🎨';
            if (stage.includes('Planning')) return '📅';
            if (stage.includes('Execution') || stage.includes('Coding')) return '⚙️';
            if (stage.includes('Generation')) return '✨';
            if (stage.includes('Evaluation') || stage.includes('Testing')) return '🧪';
            if (stage.includes('Refinement') || stage.includes('Optimization')) return '🔧';
            if (stage.includes('Completed')) return '✅';
        }
        return '🧠';
    };

    const getStatusBorderColor = (status: ThoughtStep['status']): string => {
        switch (status) {
            case 'completed': return 'border-green-500';
            case 'in-progress': return 'border-yellow-500';
            case 'failed': return 'border-red-500';
            case 'pending': return 'border-gray-500';
            case 'skipped': return 'border-gray-600';
            case 'info': return 'border-blue-500';
            default: return 'border-gray-600';
        }
    };

    const getStatusBackground = (status: ThoughtStep['status']): string => {
        switch (status) {
            case 'completed': return 'bg-green-700 bg-opacity-50';
            case 'in-progress': return 'bg-yellow-700 bg-opacity-50';
            case 'failed': return 'bg-red-700 bg-opacity-50';
            case 'pending': return 'bg-gray-600 bg-opacity-50';
            case 'skipped': return 'bg-gray-700 bg-opacity-50';
            case 'info': return 'bg-blue-700 bg-opacity-50';
            default: return 'bg-gray-700 bg-opacity-50';
        }
    };

    return (
        <div className={`p-3 rounded-md shadow bg-gray-750 border-l-4 ${getStatusBorderColor(thought.status)} max-w-full overflow-x-hidden`}>
            <div className="flex items-center justify-between mb-1">
                <ClientTimestamp timestamp={thought.timestamp} className="text-xs text-gray-400" />
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getStatusBackground(thought.status)} ${getStatusColor(thought.status).replace('text-', 'text-opacity-90')}`}>
                    思考过程 | {thought.status.toUpperCase()}
                </span>
            </div>
            <p className="text-sm font-semibold text-gray-100 mb-1 break-all">
                <span className="mr-2">{getStageIcon(thought.stage)}</span>
                [{typeof thought.stage === 'string' ? thought.stage : 'Step'}]: {thought.description}
            </p>
            {thought.details && (
                <div className="mt-1 p-2 bg-gray-800 rounded text-xs text-gray-300 overflow-x-hidden">
                    <pre className="whitespace-pre-wrap break-all">
                        {typeof thought.details === 'string' ? thought.details : JSON.stringify(thought.details, null, 2)}
                    </pre>
                </div>
            )}
            {thought.decision && <p className="text-xs mt-1 text-sky-400 break-all"><strong>决策:</strong> {thought.decision}</p>}
            {thought.alternativesConsidered && thought.alternativesConsidered.length > 0 && (
                <p className="text-xs mt-1 text-gray-400 break-all">
                    考虑的替代方案: {thought.alternativesConsidered.join(', ')}
                </p>
            )}
        </div>
    );
};

// 执行操作日志条目
const ActionLogItem: React.FC<{ action: any }> = ({ action }) => {
    const getLogStatusClass = (level: LogLevel): string => {
        switch (level) {
            case LogLevel.ERROR: return 'text-red-400 border-red-500';
            case LogLevel.SUCCESS: return 'text-green-400 border-green-500';
            case LogLevel.WARNING: return 'text-yellow-400 border-yellow-500';
            case LogLevel.INFO: return 'text-blue-400 border-blue-500';
            case LogLevel.DEBUG: return 'text-purple-400 border-purple-500';
            default: return 'text-gray-400 border-gray-500';
        }
    };

    return (
        <div className={`p-2 rounded-md bg-gray-750 border-l-4 ${getLogStatusClass(action.level)} max-w-full overflow-x-hidden`}>
            <div className="flex items-start">
                <span className="mr-2 text-gray-500">{format(new Date(action.timestamp), 'HH:mm:ss')}</span>
                <span className={`font-semibold mr-1 ${getLogStatusClass(action.level).split(' ')[0]}`}>
                    执行操作 | [{action.level.toUpperCase()}]
                </span>
                <span className="flex-1 text-gray-300 break-all">{action.message}</span>
            </div>
            {action.context && (
                <div className="ml-12 mt-1 text-xs text-gray-400 overflow-x-hidden">
                    <pre className="whitespace-pre-wrap bg-gray-800 p-1 rounded break-all">
                        {typeof action.context === 'string' ? action.context : JSON.stringify(action.context, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
};

// 文件变更日志条目
const FileChangeLogItem: React.FC<{ fileChange: FileChange }> = ({ fileChange }) => {
    const getOperationStyles = (operation: FileChange['operation']) => {
        switch (operation) {
            case 'create':
                return {
                    borderColor: 'border-green-500',
                    textColor: 'text-green-400',
                    icon: '📄+',
                };
            case 'update':
                return {
                    borderColor: 'border-yellow-500',
                    textColor: 'text-yellow-400',
                    icon: '✏️',
                };
            case 'delete':
                return {
                    borderColor: 'border-red-500',
                    textColor: 'text-red-400',
                    icon: '🗑️',
                };
            default:
                return {
                    borderColor: 'border-gray-500',
                    textColor: 'text-gray-400',
                    icon: '⚙️',
                };
        }
    };

    const opStyles = getOperationStyles(fileChange.operation);

    return (
        <div className={`p-3 rounded-md bg-gray-750 shadow-sm border-l-4 ${opStyles.borderColor} max-w-full overflow-x-hidden`}>
            <div className="flex items-center justify-between mb-1">
                <p className={`font-semibold ${opStyles.textColor}`}>
                    <span className="mr-2 text-lg">{opStyles.icon}</span>
                    文件变更 | {fileChange.operation.toUpperCase()}
                </p>
                {fileChange.timestamp && (
                    <span className="text-xs text-gray-400">
                        {format(new Date(fileChange.timestamp), 'HH:mm:ss')}
                    </span>
                )}
            </div>
            <p className="text-gray-300 break-all">
                {fileChange.file.path || fileChange.file.name || 'Unknown file'}
            </p>
            {fileChange.diff && (
                <div className="mt-2 overflow-x-hidden">
                    <p className="text-xs text-gray-400 mb-1">变更详情:</p>
                    <pre className="p-2 bg-gray-800 rounded text-xs text-gray-300 whitespace-pre-wrap overflow-x-hidden max-h-32 break-all">
                        {fileChange.diff}
                    </pre>
                </div>
            )}
            {!fileChange.timestamp && fileChange.file.updatedAt && (
                <p className="text-xs text-gray-500 mt-1 text-right">
                    文件更新时间: {format(new Date(fileChange.file.updatedAt), 'HH:mm:ss')}
                </p>
            )}
        </div>
    );
};

export default AIConversationHistoryPanel;
