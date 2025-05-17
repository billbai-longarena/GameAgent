'use client';

import React from 'react';
import { File as ProjectFile, FileType } from '@/types/file';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism'; // Changed to atomDark

interface FileViewerProps {
    file?: ProjectFile | null;
}

const getLanguageForSyntaxHighlighter = (fileName: string, fileType: FileType): string | undefined => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (fileType === FileType.SOURCE_CODE || fileType === FileType.STYLE || fileType === FileType.CONFIG || fileType === FileType.TEST) {
        switch (extension) {
            case 'js': return 'javascript';
            case 'jsx': return 'jsx';
            case 'ts': return 'typescript';
            case 'tsx': return 'tsx';
            case 'py': return 'python';
            case 'java': return 'java';
            case 'c': return 'c';
            case 'cpp': return 'cpp';
            case 'cs': return 'csharp';
            case 'go': return 'go';
            case 'rb': return 'ruby';
            case 'php': return 'php';
            case 'swift': return 'swift';
            case 'kt': return 'kotlin';
            case 'rs': return 'rust';
            case 'html': return 'html';
            case 'css': return 'css';
            case 'scss': return 'scss';
            case 'less': return 'less';
            case 'json': return 'json';
            case 'yaml':
            case 'yml': return 'yaml';
            case 'xml': return 'xml';
            case 'md': return 'markdown';
            case 'sh': return 'bash';
            case 'sql': return 'sql';
            default: return 'plaintext';
        }
    }
    if (fileType === FileType.DOCUMENT && extension === 'md') return 'markdown';
    return undefined; // For non-code files or unknown extensions
};


const FileViewer: React.FC<FileViewerProps> = ({ file }) => {
    if (!file) {
        return (
            <div className="p-4 text-sm text-gray-400 flex items-center justify-center h-full">
                选择一个文件以查看其内容。
            </div>
        );
    }

    const renderContent = () => {
        if (file.isBinary) {
            return <p className="text-sm text-yellow-400 p-4">这是一个二进制文件，无法显示预览。</p>;
        }
        if (typeof file.content !== 'string') { // Check if content is string
            return <p className="text-sm text-gray-500 p-4">文件没有内容或无法加载。</p>;
        }

        const language = getLanguageForSyntaxHighlighter(file.name, file.type);

        if (language) {
            return (
                <SyntaxHighlighter
                    language={language}
                    style={atomDark} // Changed to atomDark
                    customStyle={{
                        margin: 0,
                        padding: '1rem',
                        borderRadius: '0 0 0.5rem 0.5rem', // Rounded bottom corners if header is separate
                        backgroundColor: '#1d1f21' // Background color for atomDark, adjust if needed
                    }}
                    showLineNumbers={true}
                    lineNumberStyle={{ color: '#666', fontSize: '0.8em', marginRight: '1em' }}
                    wrapLines={true}
                    wrapLongLines={true}
                >
                    {file.content}
                </SyntaxHighlighter>
            );
        }
        // For plain text or unsupported types
        return <pre className="text-xs text-gray-300 whitespace-pre-wrap p-4">{file.content}</pre>;
    };

    return (
        <div className="flex flex-col h-full bg-gray-750 rounded-lg overflow-hidden shadow">
            <div className="p-3 border-b border-gray-600 bg-gray-800">
                <h4 className="text-md font-semibold text-gray-100 truncate" title={file.path}>
                    {file.name}
                </h4>
                <p className="text-xxs text-gray-400 truncate">{file.path}</p>
            </div>
            <div className="flex-grow overflow-auto">
                {renderContent()}
            </div>
        </div>
    );
};

export default FileViewer;
