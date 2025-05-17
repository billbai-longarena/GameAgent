'use client';

import React from 'react';
import { AgentStatus, DevelopmentStage } from '@/types/agent'; // Assuming these types are available
import { FiClipboard, FiLayout, FiCode, FiCheckCircle, FiZap, FiAward, FiPause, FiPlay, FiStopCircle, FiRefreshCw, FiPlayCircle } from 'react-icons/fi'; // Import icons for controls

// Define the order of stages for the visual indicator
const STAGES_ORDER: DevelopmentStage[] = [
    DevelopmentStage.REQUIREMENT_ANALYSIS,
    DevelopmentStage.DESIGN,
    DevelopmentStage.CODING,
    DevelopmentStage.TESTING,
    DevelopmentStage.OPTIMIZATION,
    DevelopmentStage.COMPLETED,
];

interface ProgressIndicatorProps {
    progress: number; // 0-100
    currentStage?: DevelopmentStage;
}

const STAGE_ICONS: Record<DevelopmentStage, React.ElementType> = {
    [DevelopmentStage.REQUIREMENT_ANALYSIS]: FiClipboard,
    [DevelopmentStage.DESIGN]: FiLayout,
    [DevelopmentStage.CODING]: FiCode,
    [DevelopmentStage.TESTING]: FiCheckCircle,
    [DevelopmentStage.OPTIMIZATION]: FiZap,
    [DevelopmentStage.COMPLETED]: FiAward,
};

const STAGE_DISPLAY_NAMES: Record<DevelopmentStage, string> = {
    [DevelopmentStage.REQUIREMENT_ANALYSIS]: '需求分析',
    [DevelopmentStage.DESIGN]: '设计规划',
    [DevelopmentStage.CODING]: '代码编写',
    [DevelopmentStage.TESTING]: '测试调试',
    [DevelopmentStage.OPTIMIZATION]: '优化完善',
    [DevelopmentStage.COMPLETED]: '已完成',
};


const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ progress, currentStage }) => {
    const stageText = currentStage ? STAGE_DISPLAY_NAMES[currentStage] : '加载中...';
    const currentStageIndex = currentStage ? STAGES_ORDER.indexOf(currentStage) : -1;

    return (
        <div className="w-full" title={`当前阶段: ${stageText}, 进度: ${progress}%`}>
            <div className="text-xs text-gray-400 mb-1 flex justify-between">
                <span>阶段: <span className="font-semibold text-gray-200">{stageText}</span></span>
                <span className="font-semibold text-gray-200">{progress}%</span>
            </div>
            <div
                className="w-full bg-gray-600 rounded-full h-2.5 relative flex items-center"
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`进度: ${progress}% 阶段 ${stageText}`}
            >
                <div
                    className="bg-sky-500 h-2.5 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-2 px-0.5">
                {STAGES_ORDER.map((stage, index) => {
                    const IconComponent = STAGE_ICONS[stage];
                    const displayName = STAGE_DISPLAY_NAMES[stage];
                    const isActive = index <= currentStageIndex;
                    const isCurrent = index === currentStageIndex;

                    return (
                        <div
                            key={stage}
                            className={`flex flex-col items-center relative ${isActive ? 'text-sky-400 font-medium' : 'text-gray-600'}`}
                            title={displayName}
                        >
                            {/* Icon */}
                            <div className={`relative z-10 p-1 rounded-full ${isCurrent ? 'bg-sky-500 text-white' : isActive ? 'bg-sky-600 text-sky-300' : 'bg-gray-700 text-gray-500'}`}>
                                <IconComponent className={`w-3 h-3 ${isCurrent ? 'animate-pulse' : ''}`} />
                            </div>
                            {/* Stage Name (optional, if space allows or for tooltips) */}
                            {/* <span className="mt-1 text-xxs">{displayName.substring(0,2)}</span> */}

                            {/* Connecting line to the next icon */}
                            {index < STAGES_ORDER.length - 1 && (
                                <div
                                    className={`absolute top-[calc(0.375rem+1px)] left-1/2 w-full h-0.5 transform -translate-y-1/2 z-0`}
                                    style={{
                                        left: 'calc(50% + 0.5rem)', // Start after the icon
                                        width: 'calc(100% - 1rem)', // Span between icons
                                    }}
                                >
                                    <div className={`h-full w-full ${index < currentStageIndex ? 'bg-sky-500' : 'bg-gray-600'}`}></div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

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
            {/* Pause Button */}
            {/* Pause Button: Show if agent is actively working */}
            {(agentStatus === AgentStatus.THINKING || agentStatus === AgentStatus.CODING || agentStatus === AgentStatus.TESTING) && (
                <button
                    onClick={onPause}
                    className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium bg-yellow-600 hover:bg-yellow-500 rounded-md text-white shadow-sm transition-colors"
                    title="暂停 Agent"
                >
                    <FiPause className="w-3 h-3" />
                    <span>暂停</span>
                </button>
            )}

            {/* Resume Button: Show if agent is paused */}
            {agentStatus === AgentStatus.PAUSED && (
                <button
                    onClick={onResume}
                    className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium bg-green-600 hover:bg-green-500 rounded-md text-white shadow-sm transition-colors"
                    title="继续 Agent"
                >
                    <FiPlay className="w-3 h-3" />
                    <span>继续</span>
                </button>
            )}

            {/* Stop Button: Show if agent is actively working or paused */}
            {(agentStatus === AgentStatus.THINKING || agentStatus === AgentStatus.CODING || agentStatus === AgentStatus.TESTING || agentStatus === AgentStatus.PAUSED) && (
                <button
                    onClick={onStop}
                    className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium bg-red-600 hover:bg-red-500 rounded-md text-white shadow-sm transition-colors"
                    title="停止当前任务"
                >
                    <FiStopCircle className="w-3 h-3" />
                    <span>停止</span>
                </button>
            )}

            {/* Start/Reset Button: Show if agent is IDLE, COMPLETED, or ERROR */}
            {(agentStatus === AgentStatus.IDLE || agentStatus === AgentStatus.COMPLETED || agentStatus === AgentStatus.ERROR) && (
                <button
                    onClick={onStop} // Calling onStop here effectively resets the agent for a new task via backend logic
                    className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium bg-sky-600 hover:bg-sky-500 rounded-md text-white shadow-sm transition-colors"
                    title={agentStatus === AgentStatus.IDLE ? "准备开始新任务 (Agent将重置)" : "重置 Agent"}
                >
                    {agentStatus === AgentStatus.IDLE ? <FiPlayCircle className="w-3 h-3" /> : <FiRefreshCw className="w-3 h-3" />}
                    <span>{agentStatus === AgentStatus.IDLE ? '新任务' : '重置'}</span>
                </button>
            )}
        </div>
    );
};

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
        <div className="flex flex-col sm:flex-row items-center sm:justify-between p-2.5 border-t border-gray-700 bg-gray-800 text-white text-sm shadow-inner gap-2 sm:gap-0">
            {/* Left section: Status and Time - takes full width on smallest screens, then shrinks */}
            <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto space-x-3">
                <StageIndicator agentStatus={agentStatus} />
                <TimeEstimator estimatedTimeRemaining={estimatedTimeRemaining} />
            </div>
            {/* Center section: Progress Indicator - takes full width on smallest screens */}
            <div className="w-full sm:flex-grow mx-0 sm:mx-4 my-2 sm:my-0">
                <ProgressIndicator progress={progress} currentStage={currentStage} />
            </div>
            {/* Right section: Control Buttons - takes full width on smallest screens, then shrinks */}
            <div className="w-full sm:w-auto flex justify-center sm:justify-end">
                <ControlButtons agentStatus={agentStatus} onPause={onPause} onResume={onResume} onStop={onStop} />
            </div>
        </div>
    );
};


export default StatusControlBar;
