'use client';

import React, { useState } from 'react';
import { GameListItem } from '@/types/game'; // Assuming GameListItem type will be created

// Mock data for GameListItem, replace with actual data source later
const mockGameItems: GameListItem[] = [
    {
        id: 'quiz-template',
        name: '问答游戏模板',
        description: '一个基础的问答游戏，支持选择题和判断题。',
        version: '1.0.0',
        previewImageUrl: '/templates/quiz/quiz-preview.png',
        entryPoint: '/templates/quiz/index.html',
        tags: ['教育', '知识测验'],
        author: 'GameAgent Team',
        isGenerated: false,
    },
    {
        id: 'matching-template',
        name: '匹配游戏模板',
        description: '一个基础的匹配游戏，将项目进行配对。',
        version: '1.0.0',
        previewImageUrl: '/templates/matching/matching-preview.png',
        entryPoint: '/templates/matching/index.html',
        tags: ['教育', '记忆', '配对'],
        author: 'GameAgent Team',
        isGenerated: false,
    },
    {
        id: 'sorting-template',
        name: '排序游戏模板',
        description: '一个基础的排序游戏，用户可以将项目拖动到正确的顺序。',
        version: '1.0.0',
        previewImageUrl: '/templates/sorting/sorting-preview.png',
        entryPoint: '/templates/sorting/index.html',
        tags: ['教育', '逻辑', '排序'],
        author: 'GameAgent Team',
        isGenerated: false,
    },
];


interface ProjectExplorerPanelProps {
    gameItems: GameListItem[];
    onPreviewGame: (gameUrl: string) => void;
    // onOpenFile: (file: ProjectFile) => void; // Callback when a file is to be "opened"
}

const ProjectExplorerPanel: React.FC<ProjectExplorerPanelProps> = ({
    gameItems = mockGameItems, // Default to mock data for now
    onPreviewGame,
}) => {
    const [isCollapsed, setIsCollapsed] = useState(false); // State for panel collapse
    const [loading, setLoading] = useState<boolean>(false); // Mock loading state
    const [error, setError] = useState<string | null>(null); // Mock error state

    // Simulate fetching game items (can be removed if props are always provided)
    // useEffect(() => {
    //     setLoading(true);
    //     // Simulate API call
    //     setTimeout(() => {
    //         // setGameItems(mockGameItems); // This would come from props or a service
    //         setLoading(false);
    //     }, 1000);
    // }, []);


    if (isCollapsed) {
        return (
            <button
                onClick={() => setIsCollapsed(false)}
                className="p-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-r-lg absolute left-0 top-1/3 z-10"
                title="展开游戏列表"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
            </button>
        );
    }

    const handleExperienceClick = (game: GameListItem) => {
        onPreviewGame(game.entryPoint);
    };

    return (
        <div className="flex flex-col h-full bg-gray-800 text-white rounded-lg shadow-lg w-64 min-w-[200px] relative">
            <div className="flex items-center justify-between p-3 border-b border-gray-700">
                <h2 className="text-lg font-semibold text-gray-100">游戏列表</h2>
                <button
                    onClick={() => setIsCollapsed(true)}
                    className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-gray-100"
                    title="折叠游戏列表"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                </button>
            </div>

            <div className="flex-grow p-2 overflow-y-auto">
                {loading && <div className="p-4 text-center">正在加载游戏列表...</div>}
                {error && <div className="p-4 text-center text-red-500">{error}</div>}
                {!loading && !error && gameItems.length === 0 && (
                    <div className="p-4 text-center text-gray-400">没有可用的游戏。</div>
                )}
                {!loading && !error && gameItems.length > 0 && (
                    <div className="grid grid-cols-1 gap-3">
                        {gameItems.map((game) => (
                            <div key={game.id} className="bg-gray-700 rounded-lg shadow p-3 flex flex-col justify-between">
                                <div>
                                    <h3 className="text-md font-bold text-teal-400 mb-1 truncate">{game.name}</h3>
                                    {game.previewImageUrl && (
                                        <img
                                            src={game.previewImageUrl}
                                            alt={`${game.name} preview`}
                                            className="w-full h-24 object-cover rounded mb-2 bg-gray-600"
                                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                        />
                                    )}
                                    <p className="text-xs text-gray-300 mb-1 truncate">{game.description}</p>
                                    {game.isGenerated && game.generatedAt && (
                                        <p className="text-xs text-gray-400 mb-1">
                                            生成于: {new Date(game.generatedAt).toLocaleString()}
                                        </p>
                                    )}
                                    {!game.isGenerated && game.version && (
                                        <p className="text-xs text-gray-400 mb-1">版本: {game.version}</p>
                                    )}
                                </div>
                                <button
                                    onClick={() => handleExperienceClick(game)}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1.5 px-3 rounded text-sm transition duration-150 ease-in-out mt-2"
                                >
                                    体验
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProjectExplorerPanel;
