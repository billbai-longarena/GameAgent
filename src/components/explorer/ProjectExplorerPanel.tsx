'use client';

import React, { useState } from 'react';
import { File as ProjectFile } from '@/types/file'; // Assuming ProjectFile type
import FileTree from './FileTree';
import FileViewer from './FileViewer';

interface ProjectExplorerPanelProps {
    projectFiles: ProjectFile[]; // List of files in the current project
    // onOpenFile: (file: ProjectFile) => void; // Callback when a file is to be "opened"
}

const ProjectExplorerPanel: React.FC<ProjectExplorerPanelProps> = ({
    projectFiles = [], // Default to empty array
}) => {
    const [selectedFile, setSelectedFile] = useState<ProjectFile | null>(null);
    const [isCollapsed, setIsCollapsed] = useState(false); // State for panel collapse

    const handleSelectFile = (file: ProjectFile) => {
        setSelectedFile(file);
    };

    if (isCollapsed) {
        return (
            <button
                onClick={() => setIsCollapsed(false)}
                className="p-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-r-lg absolute left-0 top-1/3 z-10"
                title="展开项目资源管理器"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
            </button>
        );
    }

    return (
        <div className="flex flex-col h-full bg-gray-800 text-white rounded-lg shadow-lg w-64 min-w-[200px] relative">
            <div className="flex items-center justify-between p-3 border-b border-gray-700">
                <h3 className="text-md font-semibold text-gray-200">项目资源</h3>
                <button
                    onClick={() => setIsCollapsed(true)}
                    className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-gray-100"
                    title="折叠项目资源管理器"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                </button>
            </div>

            <div className="flex-grow flex flex-col overflow-hidden">
                <div className="p-2 overflow-y-auto h-1/3 border-b border-gray-700">
                    <FileTree files={projectFiles} onSelectFile={handleSelectFile} selectedFilePath={selectedFile?.path} />
                </div>
                <div className="flex-grow overflow-y-auto">
                    <FileViewer file={selectedFile} />
                </div>
            </div>
        </div>
    );
};

export default ProjectExplorerPanel;
