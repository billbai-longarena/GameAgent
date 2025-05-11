'use client';

import React from 'react';
import { AgentState, AgentAction, LogLevel } from '@/types/agent'; // Assuming AgentState will be passed as prop

interface ActionExecutionPanelProps {
    agentState?: AgentState | null;
}

const ActionExecutionPanel: React.FC<ActionExecutionPanelProps> = ({ agentState }) => {
    // Display recent actions or logs related to execution
    const actionsToShow = agentState?.logs
        ?.filter(log =>
            log.message.startsWith("Execution:") ||
            agentState.action?.description === log.message // Show the current primary action
        )
        .slice(-10) // Show last 10 relevant logs/actions
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()); // Sort by time

    const currentAction = agentState?.action;

    return (
        <div className="p-4 h-full bg-gray-700 rounded-lg shadow text-gray-200">
            <h3 className="text-lg font-semibold mb-3 border-b border-gray-600 pb-2">执行操作</h3>

            {currentAction && (
                <div className="mb-3 p-2 border border-dashed border-sky-500 rounded-md bg-gray-750">
                    <p className="text-sm font-semibold text-sky-400">当前操作: {currentAction.type}</p>
                    <p className="text-xs text-gray-300 whitespace-pre-wrap">{currentAction.description}</p>
                    {currentAction.target && <p className="text-xs text-gray-400">目标: {currentAction.target}</p>}
                    <p className="text-xs text-gray-500 mt-1">{new Date(currentAction.timestamp).toLocaleTimeString()}</p>
                </div>
            )}

            {actionsToShow && actionsToShow.length > 0 ? (
                <div className="space-y-2 text-xs">
                    {actionsToShow.map((log) => (
                        <div key={log.id} className={`p-2 rounded-md bg-gray-650 ${log.level === LogLevel.ERROR ? 'border-l-2 border-red-500' : log.level === LogLevel.SUCCESS ? 'border-l-2 border-green-500' : 'border-l-2 border-gray-500'}`}>
                            <span className="font-medium text-gray-300">{log.message}</span>
                            {log.context && typeof log.context.details === 'string' && (
                                <span className="text-gray-400 block text-xxs">Details: {log.context.details}</span>
                            )}
                            <span className="block text-xxs text-gray-500 mt-0.5">{new Date(log.timestamp).toLocaleTimeString()}</span>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-sm text-gray-400">
                    {currentAction ? '等待操作日志...' : '没有正在执行的操作或相关日志。'}
                </p>
            )}
        </div>
    );
};

export default ActionExecutionPanel;
