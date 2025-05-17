import React, { useEffect, useState } from 'react';
import { TemplateManifest } from '@/types/template';
// 假设有一个服务或方法来获取模板列表和预览URL
// import { getTemplates, getTemplatePreviewUrl } from '@/services/template.service'; 

// 模拟的模板数据，实际应从API或文件系统获取
const mockTemplates: TemplateManifest[] = [
    {
        id: 'quiz-template',
        name: '问答游戏模板',
        description: '一个基础的问答游戏，支持选择题和判断题。',
        version: '1.0.0',
        previewImageUrl: '/templates/quiz/quiz-preview.png', // 假设有预览图
        entryPoint: '/templates/quiz/index.html',
        tags: ['教育', '知识测验'],
        author: 'GameAgent Team',
    },
    {
        id: 'matching-template',
        name: '匹配游戏模板',
        description: '一个基础的匹配游戏，将项目进行配对。',
        version: '1.0.0',
        previewImageUrl: '/templates/matching/matching-preview.png', // 假设有预览图
        entryPoint: '/templates/matching/index.html',
        tags: ['教育', '记忆', '配对'],
        author: 'GameAgent Team',
    },
    {
        id: 'sorting-template',
        name: '排序游戏模板',
        description: '一个基础的排序游戏，用户可以将项目拖动到正确的顺序。',
        version: '1.0.0',
        previewImageUrl: '/templates/sorting/sorting-preview.png', // 假设有预览图
        entryPoint: '/templates/sorting/index.html',
        tags: ['教育', '逻辑', '排序'],
        author: 'GameAgent Team',
    },
];

interface TemplateExplorerPanelProps {
    onPreviewTemplate: (templateUrl: string) => void;
    // 未来可能需要 projectId 等其他 props
}

const TemplateExplorerPanel: React.FC<TemplateExplorerPanelProps> = ({ onPreviewTemplate }) => {
    const [templates, setTemplates] = useState<TemplateManifest[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // 模拟异步加载模板数据
        const fetchTemplates = async () => {
            setLoading(true);
            setError(null);
            try {
                // 实际应用中，这里会调用服务从后端API或文件系统读取模板 manifest
                // const fetchedTemplates = await getTemplates(); 
                // For now, use mock data with a delay
                await new Promise(resolve => setTimeout(resolve, 500));
                setTemplates(mockTemplates);
            } catch (err) {
                console.error('Failed to load templates:', err);
                setError('无法加载游戏模板列表。');
            } finally {
                setLoading(false);
            }
        };

        fetchTemplates();
    }, []);

    const handleExperienceClick = (template: TemplateManifest) => {
        // const previewUrl = getTemplatePreviewUrl(template.id, template.entryPoint);
        // 简化处理，直接使用 entryPoint 作为 URL
        // 注意：实际部署时，这些路径需要正确配置，可能需要相对于 public 目录
        onPreviewTemplate(template.entryPoint);
    };

    if (loading) {
        return <div className="p-4 text-center">正在加载模板...</div>;
    }

    if (error) {
        return <div className="p-4 text-center text-red-500">{error}</div>;
    }

    if (templates.length === 0) {
        return <div className="p-4 text-center">没有可用的游戏模板。</div>;
    }

    return (
        <div className="p-4 bg-gray-800 text-white h-full overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4 text-gray-100">游戏模板浏览器</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template) => (
                    <div key={template.id} className="bg-gray-700 rounded-lg shadow-lg p-4 flex flex-col justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-teal-400 mb-2">{template.name}</h3>
                            {template.previewImageUrl && (
                                <img
                                    src={template.previewImageUrl}
                                    alt={`${template.name} preview`}
                                    className="w-full h-32 object-cover rounded mb-2 bg-gray-600"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} // Hide if image fails to load
                                />
                            )}
                            <p className="text-sm text-gray-300 mb-1">{template.description}</p>
                            <p className="text-xs text-gray-400 mb-2">版本: {template.version}</p>
                            {template.tags && template.tags.length > 0 && (
                                <div className="mb-3">
                                    {template.tags.map(tag => (
                                        <span key={tag} className="inline-block bg-teal-600 text-white text-xs px-2 py-1 rounded-full mr-1 mb-1">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => handleExperienceClick(template)}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition duration-150 ease-in-out mt-auto"
                        >
                            体验模板
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TemplateExplorerPanel;