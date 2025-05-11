'use client';

import React from 'react';
import { AgentState } from '@/types/agent'; // Assuming AgentState will be passed as prop

interface ThinkingProcessPanelProps {
    agentState?: AgentState | null; // Make agentState optional for now
}

const ThinkingProcessPanel: React.FC<ThinkingProcessPanelProps> = ({ agentState }) => {
    // Display the main 'thinking' string
    const currentThinking = agentState?.thinking || 'Agent is currently idle or initializing...';

    // Optionally, display recent logs or specific thought steps if structured in AgentState.logs
    // For now, we'll keep it simple.

    return (
        <div className="p-4 h-full bg-gray-700 rounded-lg shadow text-gray-200">
            <h3 className="text-lg font-semibold mb-3 border-b border-gray-600 pb-2">思考过程</h3>
            <div className="prose prose-sm prose-invert max-w-none">
                <p className="whitespace-pre-wrap">{currentThinking}</p>
            </div>
            {/* Future: Display a more structured list of thought steps or logs */}
            {/* 
            {agentState?.logs && agentState.logs.filter(log => log.level === 'info' && log.message.startsWith("Thinking:")).length > 0 && (
                <div className="mt-4">
                    <h4 className="text-md font-semibold mb-1">Recent Thoughts:</h4>
                    <ul className="list-disc list-inside text-xs space-y-1">
                        {agentState.logs
                            .filter(log => log.level === 'info' && log.message.startsWith("Thinking:"))
                            .slice(-5) // Show last 5 thinking logs
                            .map(log => (
                                <li key={log.id}>{log.message.substring("Thinking:".length).trim()}</li>
                            ))}
                    </ul>
                </div>
            )}
            */}
        </div>
    );
};

export default ThinkingProcessPanel;
