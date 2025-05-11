'use client';

import React from 'react';
import { AgentState } from '@/types/agent'; // Assuming AgentState might be relevant
import { FileChange, File as ProjectFile } from '@/types/file'; // Assuming FileChange type for WebSocket events

interface FileChangesPanelProps {
    // Props to receive file change events or a list of changed files
    // For now, we'll use a placeholder. This would likely come from WebSocket updates.
    fileChanges?: FileChange[]; // Example: an array of recent file changes
    currentProjectFiles?: ProjectFile[]; // List of all files in the project for context
}

const FileChangesPanel: React.FC<FileChangesPanelProps> = ({ fileChanges = [] }) => {
    // In a real implementation, this panel would subscribe to WebSocket events
    // like 'file:created', 'file:updated', 'file:deleted' and update its display.
    // The `fileChanges` prop is a placeholder for such data.

    const recentChanges = fileChanges.slice(-10).reverse(); // Show last 10, newest first

    return (
        <div className="p-4 h-full bg-gray-700 rounded-lg shadow text-gray-200">
            <h3 className="text-lg font-semibold mb-3 border-b border-gray-600 pb-2">文件变更</h3>

            {recentChanges.length > 0 ? (
                <div className="space-y-2 text-xs">
                    {recentChanges.map((change, index) => (
                        <div key={index} className={`p-2 rounded-md bg-gray-650 border-l-2 
                            ${change.operation === 'create' ? 'border-green-500' : ''}
                            ${change.operation === 'update' ? 'border-yellow-500' : ''}
                            ${change.operation === 'delete' ? 'border-red-500' : ''}
                        `}>
                            <p className="font-medium">
                                <span className={`uppercase font-bold mr-2 
                                    ${change.operation === 'create' ? 'text-green-400' : ''}
                                    ${change.operation === 'update' ? 'text-yellow-400' : ''}
                                    ${change.operation === 'delete' ? 'text-red-400' : ''}
                                `}>
                                    {change.operation}
                                </span>
                                {change.file.path || change.file.name || 'Unknown file'}
                            </p>
                            {change.diff && (
                                <pre className="mt-1 p-1 bg-gray-800 rounded text-xxs whitespace-pre-wrap overflow-x-auto">
                                    {change.diff}
                                </pre>
                            )}
                            {change.file.updatedAt && (
                                <p className="text-xxs text-gray-400 mt-0.5">
                                    {new Date(change.file.updatedAt).toLocaleTimeString()}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-sm text-gray-400">目前没有检测到文件变更。</p>
            )}
            {/* TODO: Implement actual WebSocket listener for file changes */}
            {/* TODO: Potentially show a diff view for 'update' operations */}
        </div>
    );
};

export default FileChangesPanel;
