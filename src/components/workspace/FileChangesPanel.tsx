'use client';

import React from 'react';
import { FileChange } from '@/types/file';
import { format } from 'date-fns'; // For timestamp formatting

interface FileChangesPanelProps {
    fileChanges?: FileChange[];
}

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

const FileChangesPanel: React.FC<FileChangesPanelProps> = ({ fileChanges = [] }) => {
    const recentChanges = fileChanges.slice(-15).reverse(); // Show last 15, newest first

    return (
        <div className="p-4 h-full bg-gray-800 text-gray-200 rounded-lg shadow-md flex flex-col overflow-hidden">
            <h3 className="text-xl font-semibold mb-3 border-b border-gray-700 pb-2 text-gray-100">
                文件变更记录
            </h3>

            {recentChanges.length > 0 ? (
                <div className="flex-grow overflow-y-auto space-y-3 pr-2 text-sm">
                    {recentChanges.map((change, index) => {
                        const opStyles = getOperationStyles(change.operation);
                        return (
                            <div
                                key={change.id || `${change.file.id}-${index}`} // Use change.id if available, else fallback
                                className={`p-3 rounded-md bg-gray-750 shadow-sm border-l-4 ${opStyles.borderColor}`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <p className={`font-semibold ${opStyles.textColor}`}>
                                        <span className="mr-2 text-lg">{opStyles.icon}</span>
                                        {change.operation.toUpperCase()}
                                    </p>
                                    {change.timestamp && ( // Check if timestamp exists
                                        <span className="text-xs text-gray-400">
                                            {format(new Date(change.timestamp), 'HH:mm:ss')}
                                        </span>
                                    )}
                                </div>
                                <p className="text-gray-300 break-all">
                                    {change.file.path || change.file.name || 'Unknown file'}
                                </p>
                                {change.diff && (
                                    <div className="mt-2">
                                        <p className="text-xs text-gray-400 mb-1">变更详情:</p>
                                        <pre className="p-2 bg-gray-800 rounded text-xs text-gray-300 whitespace-pre-wrap overflow-x-auto max-h-32">
                                            {/* Basic diff display, could be enhanced with a diff viewer */}
                                            {change.diff}
                                        </pre>
                                    </div>
                                )}
                                {/* Display updatedAt from file if available and no specific change timestamp */}
                                {!change.timestamp && change.file.updatedAt && (
                                    <p className="text-xs text-gray-500 mt-1 text-right">
                                        File Updated: {format(new Date(change.file.updatedAt), 'HH:mm:ss')}
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <p className="text-gray-400 italic">目前没有检测到文件变更。</p>
            )}
        </div>
    );
};

export default FileChangesPanel;
