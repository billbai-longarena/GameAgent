'use client';

import React from 'react';
import { AgentState, AgentAction, LogLevel, ActionType } from '@/types/agent';
import { format } from 'date-fns';

interface ActionExecutionPanelProps {
    agentState?: AgentState | null;
}

const getActionIcon = (actionType: ActionType | string): string => {
    switch (actionType) {
        case ActionType.CREATE_FILE: return '📄+';
        case ActionType.MODIFY_FILE: return '✏️';
        case ActionType.DELETE_FILE: return '🗑️';
        case ActionType.RUN_TEST: return '🧪';
        case ActionType.BUILD: return '🏗️';
        case ActionType.ANALYZE: return '🔍';
        case ActionType.USER_INPUT: return '💬';
        case ActionType.AGENT_RESPONSE: return '🤖';
        case ActionType.INITIALIZE: return '🚀';
        case ActionType.IDLE: return '💤';
        default: return '⚙️'; // Generic cog for other/unknown actions
    }
};

const getLogStatusClass = (level: LogLevel): string => {
    switch (level) {
        case LogLevel.ERROR: return 'text-red-400 border-red-500';
        case LogLevel.SUCCESS: return 'text-green-400 border-green-500';
        case LogLevel.WARNING: return 'text-yellow-400 border-yellow-500';
        case LogLevel.INFO: return 'text-blue-400 border-blue-500';
        case LogLevel.DEBUG: return 'text-purple-400 border-purple-500';
        default: return 'text-gray-400 border-gray-500';
    }
}

const ActionExecutionPanel: React.FC<ActionExecutionPanelProps> = ({ agentState }) => {
    // We will primarily display logs that represent executed actions or significant events.
    // The `agentState.action` can be used to highlight the very latest action if needed,
    // but logs provide a history.
    const executionLogs = agentState?.logs
        ?.filter(log =>
            // Filter for logs that are more likely to be "actions"
            // This is a heuristic and might need refinement based on how logs are generated.
            log.level === LogLevel.SUCCESS ||
            log.level === LogLevel.ERROR ||
            (log.level === LogLevel.INFO && (log.message.includes("Executing") || log.message.includes("Generated") || log.message.includes("Created") || log.message.includes("Modified") || log.message.includes("Deleted")))
        )
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) // Show newest first
        .slice(0, 20); // Show last 20 relevant logs

    const currentAction = agentState?.action;

    return (
        <div className="p-4 h-full bg-gray-800 text-gray-200 rounded-lg shadow-md flex flex-col overflow-hidden">
            <h3 className="text-xl font-semibold mb-3 border-b border-gray-700 pb-2 text-gray-100">
                执行操作记录
            </h3>

            {/* Display the current action prominently if it's actively doing something */}
            {currentAction && currentAction.type !== ActionType.IDLE && (
                <div className="mb-3 p-3 border border-dashed border-sky-600 rounded-md bg-gray-750 shadow">
                    <div className="flex items-center mb-1">
                        <span className="text-lg mr-2">{getActionIcon(currentAction.type)}</span>
                        <p className="text-md font-semibold text-sky-400">当前: {currentAction.type}</p>
                    </div>
                    <p className="text-sm text-gray-300 whitespace-pre-wrap ml-8">{currentAction.description}</p>
                    {currentAction.target && <p className="text-xs text-gray-400 ml-8">目标: {currentAction.target}</p>}
                    {currentAction.details && (
                        <pre className="mt-1 p-2 bg-gray-800 rounded text-xs text-gray-400 overflow-x-auto ml-8">
                            {JSON.stringify(currentAction.details, null, 2)}
                        </pre>
                    )}
                    <p className="text-xs text-gray-500 mt-1 text-right">{format(new Date(currentAction.timestamp), 'HH:mm:ss')}</p>
                </div>
            )}

            <div className="flex-grow overflow-y-auto space-y-2 pr-2 font-mono text-sm">
                {executionLogs && executionLogs.length > 0 ? (
                    executionLogs.map((log) => (
                        <div key={log.id} className={`p-2 rounded-md bg-gray-750 border-l-4 ${getLogStatusClass(log.level)}`}>
                            <div className="flex items-start">
                                <span className="mr-2 text-gray-500">{format(new Date(log.timestamp), 'HH:mm:ss')}</span>
                                <span className={`font-semibold mr-1 ${getLogStatusClass(log.level).split(' ')[0]}`}>
                                    [{log.level.toUpperCase()}]
                                </span>
                                <span className="flex-1 text-gray-300">{log.message}</span>
                            </div>
                            {log.context && (
                                <div className="ml-12 mt-1 text-xs text-gray-400">
                                    <pre className="whitespace-pre-wrap bg-gray-800 p-1 rounded">
                                        {typeof log.context === 'string' ? log.context : JSON.stringify(log.context, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <p className="text-gray-400 italic">
                        {(!currentAction || currentAction.type === ActionType.IDLE) ? '无操作记录。' : '等待执行日志...'}
                    </p>
                )}
            </div>
        </div>
    );
};

export default ActionExecutionPanel;
