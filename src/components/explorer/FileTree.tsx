'use client';

import React from 'react';
import { File as ProjectFile, FileType } from '@/types/file';

interface FileTreeProps {
    files: ProjectFile[];
    onSelectFile: (file: ProjectFile) => void;
    selectedFilePath?: string;
    // TODO: Add support for directories and nested structure
}

// Helper to get a simple icon based on file type
const getFileIcon = (fileType: FileType): string => {
    switch (fileType) {
        case FileType.SOURCE_CODE: return '📜'; // Scroll
        case FileType.DOCUMENT: return '📄';    // Page facing up
        case FileType.STYLE: return '🎨';      // Artist palette
        case FileType.ASSET: return '🖼️';     // Framed picture (for images, could vary for audio/video)
        case FileType.CONFIG: return '⚙️';     // Gear
        case FileType.TEST: return '🧪';       // Test tube
        default: return '📁'; // Default to folder icon, though this component currently doesn't handle folders
    }
};

const FileTree: React.FC<FileTreeProps> = ({ files, onSelectFile, selectedFilePath }) => {
    // This is a very basic representation. A real file tree would be recursive
    // and handle directories. For now, it's a flat list of files.
    // We will simulate a simple hierarchy based on path for display purposes if needed,
    // but the `files` prop is expected to be a flat list.

    // TODO: Implement proper recursive rendering for nested directories and files.
    // For now, just rendering all files at a root level.
    // A more advanced version would parse paths to create a tree structure.

    if (!files || files.length === 0) {
        return <p className="p-2 text-xs text-gray-400">没有项目文件。</p>;
    }

    return (
        <div className="space-y-0.5 text-sm">
            {files.map((file) => (
                <button
                    key={file.id || file.path} // Use path as fallback key if id is missing
                    onClick={() => onSelectFile(file)}
                    title={file.path}
                    className={`flex items-center w-full text-left px-2 py-1.5 rounded transition-colors duration-150
                                ${selectedFilePath === file.path
                            ? 'bg-blue-600 text-white font-medium'
                            : 'text-gray-300 hover:bg-gray-700 hover:text-gray-100'}`}
                >
                    <span className="mr-2 w-4 text-center">{getFileIcon(file.type)}</span>
                    <span className="truncate">{file.name}</span>
                </button>
            ))}
        </div>
    );
};

export default FileTree;
