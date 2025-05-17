'use client';

import React, { useState } from 'react';
import ThinkingProcessPanel from './ThinkingProcessPanel';
import ActionExecutionPanel from './ActionExecutionPanel';
import FileChangesPanel from './FileChangesPanel';
import { AgentState } from '@/types/agent'; // To pass to child components
import { FileChange } from '@/types/file';   // To pass to FileChangesPanel

type PanelType = 'thinking' | 'actions' | 'files';

interface AgentWorkspacePanelProps {
    agentState?: AgentState | null;
    fileChanges?: FileChange[]; // Example: an array of recent file changes
}

const AgentWorkspacePanel: React.FC<AgentWorkspacePanelProps> = ({
    agentState,
    fileChanges,
}) => {
    const [activePanel, setActivePanel] = useState<PanelType>('thinking');

    const renderActivePanel = () => {
        switch (activePanel) {
            case 'thinking':
                return <ThinkingProcessPanel agentState={agentState} />;
            case 'actions':
                return <ActionExecutionPanel agentState={agentState} />;
            case 'files':
                return <FileChangesPanel fileChanges={fileChanges} />;
            default:
                return <ThinkingProcessPanel agentState={agentState} />;
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-800 text-white p-4 rounded-lg shadow-lg">
            <div className="flex mb-3 border-b border-gray-700">
                <button
                    onClick={() => setActivePanel('thinking')}
                    className={`px-4 py-2 text-sm font-medium rounded-t-md
                        ${activePanel === 'thinking' ? 'bg-gray-700 text-blue-400 border-blue-400 border-b-2' : 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'}`}
                >
                    思考过程
                </button>
                <button
                    onClick={() => setActivePanel('actions')}
                    className={`px-4 py-2 text-sm font-medium rounded-t-md
                        ${activePanel === 'actions' ? 'bg-gray-700 text-blue-400 border-blue-400 border-b-2' : 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'}`}
                >
                    执行操作
                </button>
                <button
                    onClick={() => setActivePanel('files')}
                    className={`px-4 py-2 text-sm font-medium rounded-t-md
                        ${activePanel === 'files' ? 'bg-gray-700 text-blue-400 border-blue-400 border-b-2' : 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'}`}
                >
                    文件变更
                </button>
            </div>
            <div className="flex-1 overflow-y-auto">
                {renderActivePanel()}
            </div>
        </div>
    );
};

export default AgentWorkspacePanel;
