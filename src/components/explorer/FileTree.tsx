'use client';

import React from 'react';
import { File as ProjectFile, FileType } from '@/types/file';
import {
    FiFileText, FiCode, FiImage, FiSettings, FiFile, FiPackage, FiPlayCircle, FiClipboard
} from 'react-icons/fi'; // Changed FiImageIcon to FiImage
import { DiCss3, DiJavascript1, DiHtml5, DiReact, DiPython, DiMarkdown } from 'react-icons/di'; // Changed DiJs to DiJavascript1

interface FileTreeProps {
    files: ProjectFile[];
    onSelectFile: (file: ProjectFile) => void;
    selectedFilePath?: string;
    // TODO: Add support for directories and nested structure
}

// Helper to get a more specific icon based on file type and name extension
const getFileIcon = (file: ProjectFile): React.ReactElement => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    switch (file.type) {
        case FileType.SOURCE_CODE:
            if (extension === 'js' || extension === 'jsx') return <DiJavascript1 className="text-yellow-400" />;
            if (extension === 'ts' || extension === 'tsx') return <DiReact className="text-sky-400" />; // Using React icon for TSX as common case
            if (extension === 'py') return <DiPython className="text-blue-400" />;
            return <FiCode className="text-gray-400" />;
        case FileType.DOCUMENT:
            if (extension === 'md') return <DiMarkdown className="text-gray-300" />;
            return <FiFileText className="text-blue-300" />;
        case FileType.STYLE:
            if (extension === 'css') return <DiCss3 className="text-blue-500" />;
            return <FiClipboard className="text-pink-400" />; // Generic style/clipboard
        case FileType.ASSET:
            // Could check for image/audio/video extensions here
            return <FiImage className="text-green-400" />; // Changed FiImageIcon to FiImage
        case FileType.CONFIG:
            if (file.name.toLowerCase().includes('package.json')) return <FiPackage className="text-red-400" />;
            if (file.name.toLowerCase().includes('tsconfig.json')) return <FiSettings className="text-blue-400" />;
            return <FiSettings className="text-purple-400" />;
        case FileType.TEST:
            return <FiPlayCircle className="text-teal-400" />; // Using play for test execution
        default:
            if (extension === 'html') return <DiHtml5 className="text-orange-500" />;
            return <FiFile className="text-gray-500" />;
    }
};

const FileTree: React.FC<FileTreeProps> = ({ files, onSelectFile, selectedFilePath }) => {
    if (!files || files.length === 0) {
        return <p className="p-3 text-xs text-gray-500">没有项目文件。</p>;
    }

    // Sort files alphabetically by name for consistent order
    const sortedFiles = [...files].sort((a, b) => a.name.localeCompare(b.name));

    return (
        <div className="space-y-1 text-sm py-1">
            {sortedFiles.map((file) => (
                <button
                    key={file.id || file.path}
                    onClick={() => onSelectFile(file)}
                    title={file.path}
                    className={`flex items-center w-full text-left px-3 py-1.5 rounded-md transition-colors duration-100 ease-in-out
                                ${selectedFilePath === file.path
                            ? 'bg-sky-600 text-white shadow-sm'
                            : 'text-gray-300 hover:bg-gray-700 hover:text-gray-100'}`}
                >
                    <span className="mr-2.5 text-base flex-shrink-0 w-5 h-5 flex items-center justify-center">
                        {getFileIcon(file)}
                    </span>
                    <span className="truncate text-xs">{file.name}</span>
                </button>
            ))}
        </div>
    );
};

export default FileTree;
