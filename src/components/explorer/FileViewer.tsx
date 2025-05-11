'use client';

import React from 'react';
import { File as ProjectFile } from '@/types/file';

interface FileViewerProps {
    file?: ProjectFile | null;
}

const FileViewer: React.FC<FileViewerProps> = ({ file }) => {
    if (!file) {
        return (
            <div className="p-4 text-sm text-gray-400 flex items-center justify-center h-full">
                选择一个文件以查看其内容。
            </div>
        );
    }

    // Basic syntax highlighting for known types (very rudimentary)
    // A proper solution would use a library like Prism.js or Monaco Editor (read-only).
    const renderContent = () => {
        if (file.isBinary) {
            return <p className="text-sm text-yellow-400">这是一个二进制文件，无法显示预览。</p>;
        }
        if (!file.content) {
            return <p className="text-sm text-gray-500">文件没有内容或无法加载。</p>;
        }

        // Simple keyword highlighting for demonstration
        // This is not robust and just for a basic visual effect.
        if (file.type === 'source_code' || file.name.endsWith('.ts') || file.name.endsWith('.js')) {
            let highlightedContent = file.content;
            const keywords = ['const', 'let', 'var', 'function', 'import', 'export', 'if', 'else', 'return', 'class', 'interface', 'enum', 'type', 'async', 'await', 'public', 'private', 'protected'];
            keywords.forEach(keyword => {
                const regex = new RegExp(`\\b(${keyword})\\b`, 'g');
                highlightedContent = highlightedContent.replace(regex, `<span class="text-blue-400 font-semibold">$1</span>`);
            });
            const comments = /(\/\/.*|\/\*[\s\S]*?\*\/)/g;
            highlightedContent = highlightedContent.replace(comments, `<span class="text-green-500">$1</span>`);
            const strings = /(".*?"|'.*?'|`.*?`)/g;
            highlightedContent = highlightedContent.replace(strings, `<span class="text-orange-400">$1</span>`);


            return <pre className="text-xs text-gray-300 whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: highlightedContent }} />;
        }

        return <pre className="text-xs text-gray-300 whitespace-pre-wrap">{file.content}</pre>;
    };

    return (
        <div className="p-4 bg-gray-750 rounded-lg h-full overflow-auto">
            <div className="mb-3 pb-2 border-b border-gray-600">
                <h4 className="text-md font-semibold text-gray-200 truncate" title={file.path}>
                    {file.name}
                </h4>
                <p className="text-xxs text-gray-400">{file.path}</p>
            </div>
            {renderContent()}
        </div>
    );
};

export default FileViewer;
