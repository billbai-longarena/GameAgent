'use client';

import React from 'react';
import { AgentStatus, DevelopmentStage } from '@/types/agent'; // Assuming these types are available

// Placeholder for child component props
interface ProgressIndicatorProps {
    progress: number; // 0-100
    currentStage?: DevelopmentStage; // Make optional to handle potential undefined initial state
}
const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ progress, currentStage }) => {
    const stageText = currentStage ? currentStage.replace('_', ' ').toUpperCase() : 'LOADING...';
    return (
        <div className="w-1/2">
            <div className="text-xs text-gray-400 mb-0.5">
                阶段: <span className="font-semibold text-gray-300">{stageText}</span> - {progress}%
            </div>
            <div className="w-full bg-gray-600 rounded-full h-1.5">
                <div
                    className="bg-blue-500 h-1.5 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
        </div>
    );
}; // Added semicolon

interface StageIndicatorProps {
    agentStatus: AgentStatus;
}
const StageIndicator: React.FC<StageIndicatorProps> = ({ agentStatus }) => {
    let statusText = 'UNKNOWN';
    let statusColor = 'text-gray-400';
    let dotColor = 'bg-gray-400';

    if (agentStatus) {
        statusText = agentStatus.toUpperCase();
        switch (agentStatus) {
            case AgentStatus.THINKING: statusColor = 'text-yellow-400'; dotColor = 'bg-yellow-400 animate-pulse'; break;
            case AgentStatus.CODING: statusColor = 'text-blue-400'; dotColor = 'bg-blue-400 animate-pulse'; break;
            case AgentStatus.TESTING: statusColor = 'text-purple-400'; dotColor = 'bg-purple-400 animate-pulse'; break;
            case AgentStatus.COMPLETED: statusColor = 'text-green-400'; dotColor = 'bg-green-400'; break;
            case AgentStatus.PAUSED: statusColor = 'text-orange-400'; dotColor = 'bg-orange-400'; break;
            case AgentStatus.ERROR: statusColor = 'text-red-500'; dotColor = 'bg-red-500'; break;
            case AgentStatus.IDLE: statusColor = 'text-gray-300'; dotColor = 'bg-gray-300'; break;
            default:
                const exhaustiveCheck: never = agentStatus;
                statusText = 'INVALID';
                break;
        }
    } else {
        statusText = 'LOADING...';
    }

    return (
        <div className="flex items-center space-x-2">
            <span className={`w-2 h-2 rounded-full ${dotColor}`}></span>
            <span className={`text-xs font-medium ${statusColor}`}>{statusText}</span>
        </div>
    );
}; // Added semicolon

interface ControlButtonsProps {
    agentStatus: AgentStatus;
    onPause: () => void;
    onResume: () => void;
    onStop: () => void;
}
const ControlButtons: React.FC<ControlButtonsProps> = ({ agentStatus, onPause, onResume, onStop }) => {
    return ( // Explicit return and braces
        <div className="flex space-x-2">
            {(agentStatus === AgentStatus.THINKING || agentStatus === AgentStatus.CODING || agentStatus === AgentStatus.TESTING) && (
                <button onClick={onPause} className="px-2.5 py-1 text-xs bg-yellow-600 hover:bg-yellow-500 rounded text-white">暂停</button>
            )}
            {agentStatus === AgentStatus.PAUSED && (
                <button onClick={onResume} className="px-2.5 py-1 text-xs bg-green-600 hover:bg-green-500 rounded text-white">继续</button>
            )}
            {(agentStatus !== AgentStatus.IDLE && agentStatus !== AgentStatus.COMPLETED) && (
                <button onClick={onStop} className="px-2.5 py-1 text-xs bg-red-600 hover:bg-red-500 rounded text-white">停止</button>
            )}
        </div>
    );
}; // Added semicolon

interface TimeEstimatorProps {
    estimatedTimeRemaining: number; // in seconds
}
const TimeEstimator: React.FC<TimeEstimatorProps> = ({ estimatedTimeRemaining }) => {
    const formatTime = (seconds: number) => {
        if (seconds <= 0) return '--:--';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };
    return (
        <div className="text-xs text-gray-400">
            预计剩余: <span className="font-semibold text-gray-300">{formatTime(estimatedTimeRemaining)}</span>
        </div>
    );
}; // Added semicolon

interface StatusControlBarProps {
    agentStatus: AgentStatus;
    currentStage: DevelopmentStage;
    progress: number; // 0-100
    estimatedTimeRemaining: number; // in seconds
    onPause: () => void;
    onResume: () => void;
    onStop: () => void;
}

const StatusControlBar: React.FC<StatusControlBarProps> = ({
    agentStatus,
    currentStage,
    progress,
    estimatedTimeRemaining,
    onPause,
    onResume,
    onStop,
}) => {
    return (
        <div className="flex items-center justify-between p-3 border-t border-gray-700 bg-gray-850 text-white text-sm">
            <div className="flex items-center space-x-4">
                <StageIndicator agentStatus={agentStatus} />
                <TimeEstimator estimatedTimeRemaining={estimatedTimeRemaining} />
            </div>
            <ProgressIndicator progress={progress} currentStage={currentStage} />
            <ControlButtons agentStatus={agentStatus} onPause={onPause} onResume={onResume} onStop={onStop} />
        </div>
    );
}; // Added semicolon


export default StatusControlBar;
