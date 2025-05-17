'use client';

import React from 'react';
import { AgentState, ThoughtStep, ThoughtStage, DevelopmentStage } from '@/types/agent';
import ClientTimestamp from '@/components/common/ClientTimestamp'; // 导入 ClientTimestamp

interface ThinkingProcessPanelProps {
    agentState?: AgentState | null;
}

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
    // Simple emoji icons for stages
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
    return '🧠'; // Default brain icon
};


const ThinkingProcessPanel: React.FC<ThinkingProcessPanelProps> = ({ agentState }) => {
    const thoughtProcess = agentState?.thoughtProcess || [];
    const currentOverallThinking = agentState?.thinking || 'Agent is currently idle or initializing...';

    return (
        <div className="flex flex-col h-full bg-gray-800 text-gray-200 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-3 border-b border-gray-700 pb-2 text-gray-100 px-4 pt-4">
                Agent 思考过程
            </h3>

            {/* Display current high-level thinking string for compatibility / overview */}
            <div className="mb-4 p-3 bg-gray-700 rounded mx-4">
                <p className="text-sm text-gray-300 italic whitespace-pre-wrap">{currentOverallThinking}</p>
            </div>

            {thoughtProcess.length === 0 && !agentState?.thinking && (
                <p className="text-gray-400 px-4">暂无思考步骤...</p>
            )}

            <div className="flex-1 overflow-y-auto space-y-3 px-4 pb-4">
                {thoughtProcess.map((step) => (
                    <div key={step.id} className={`p-3 rounded-md shadow bg-gray-750 border-l-4 ${getStatusBorderColor(step.status)}`}>
                        <div className="flex items-center justify-between mb-1">
                            <ClientTimestamp timestamp={step.timestamp} className="text-xs text-gray-400" />
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getStatusBackground(step.status)} ${getStatusColor(step.status).replace('text-', 'text-opacity-90')}`}>
                                {step.status.toUpperCase()}
                            </span>
                        </div>
                        <p className="text-sm font-semibold text-gray-100 mb-1">
                            <span className="mr-2">{getStageIcon(step.stage)}</span>
                            [{typeof step.stage === 'string' ? step.stage : 'Step'}]: {step.description}
                        </p>
                        {step.details && (
                            <div className="mt-1 p-2 bg-gray-800 rounded text-xs text-gray-300 overflow-x-auto">
                                <pre className="whitespace-pre-wrap">
                                    {typeof step.details === 'string' ? step.details : JSON.stringify(step.details, null, 2)}
                                </pre>
                            </div>
                        )}
                        {step.decision && <p className="text-xs mt-1 text-sky-400"><strong>Decision:</strong> {step.decision}</p>}
                        {step.alternativesConsidered && step.alternativesConsidered.length > 0 && (
                            <p className="text-xs mt-1 text-gray-400">
                                Alternatives: {step.alternativesConsidered.join(', ')}
                            </p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

// Helper for border color based on status
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

// Helper for status badge background
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


export default ThinkingProcessPanel;
