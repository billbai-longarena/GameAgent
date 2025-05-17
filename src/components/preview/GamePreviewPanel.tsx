'use client';

import React, { useEffect, useRef, useState } from 'react';

interface GamePreviewPanelProps {
    projectId: string; // Current project ID, might be used for fetching project-specific preview or settings
    previewUrl: string | null; // URL to load in the iframe, can be a template or a generated game
    onLoad?: () => void; // Callback when iframe content has loaded
    onError?: (error: string) => void; // Callback on error
}

const GamePreviewPanel: React.FC<GamePreviewPanelProps> = ({
    projectId,
    previewUrl,
    onLoad,
    onError,
}) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const panelRef = useRef<HTMLDivElement>(null); // Ref for the main panel div for fullscreen
    const [isLoading, setIsLoading] = useState(false);
    const [currentUrl, setCurrentUrl] = useState<string | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [deviceSize, setDeviceSize] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

    useEffect(() => {
        if (previewUrl && previewUrl !== currentUrl) {
            setIsLoading(true);
            setCurrentUrl(previewUrl); // Update currentUrl to the new previewUrl to trigger iframe src update
        } else if (!previewUrl && currentUrl) {
            // If previewUrl is null, clear the iframe
            setCurrentUrl(null);
            if (iframeRef.current) {
                iframeRef.current.src = 'about:blank';
            }
            setIsLoading(false);
        }
    }, [previewUrl, currentUrl]);

    const handleIframeLoad = () => {
        setIsLoading(false);
        if (onLoad) {
            onLoad();
        }
        // console.log(`Preview loaded for project ${projectId}: ${currentUrl}`);
    };

    const handleIframeError = () => {
        setIsLoading(false);
        const errorMessage = `Failed to load preview for project ${projectId}: ${currentUrl}`;
        console.error(errorMessage);
        if (onError) {
            onError(errorMessage);
        }
    };

    const handleRefresh = () => {
        if (iframeRef.current && currentUrl) {
            setIsLoading(true);
            // Append a timestamp to force a reload, bypassing cache
            const newSrc = currentUrl.includes('?') ? `${currentUrl}&t=${new Date().getTime()}` : `${currentUrl}?t=${new Date().getTime()}`;
            iframeRef.current.src = newSrc;
        }
    };

    const handleToggleFullscreen = () => {
        if (!panelRef.current) return;
        if (!document.fullscreenElement) {
            panelRef.current.requestFullscreen().catch(err => {
                alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);


    const handleDeviceSizeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setDeviceSize(event.target.value as 'desktop' | 'tablet' | 'mobile');
    };

    const getIframeSizeClass = () => {
        if (isFullscreen) return 'w-full h-full';
        switch (deviceSize) {
            case 'mobile': return 'w-[375px] h-[667px] border-2 border-gray-600 rounded-lg mx-auto my-auto'; // iPhone 6/7/8 like
            case 'tablet': return 'w-[768px] h-[1024px] border-2 border-gray-600 rounded-lg mx-auto my-auto'; // iPad like
            case 'desktop':
            default: return 'w-full h-full';
        }
    };

    return (
        <div
            ref={panelRef}
            className={`flex flex-col h-full bg-gray-800 text-white rounded-lg shadow-lg ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}
        >
            <div className="flex items-center justify-between p-2 border-b border-gray-700 space-x-2">
                <h3 className="text-md font-semibold text-gray-200 truncate">游戏预览</h3>
                <div className="flex items-center space-x-2">
                    <select
                        value={deviceSize}
                        onChange={handleDeviceSizeChange}
                        className="bg-gray-700 text-xs text-gray-300 p-1 rounded hover:bg-gray-600 focus:outline-none focus:ring-1 focus:ring-sky-500"
                        disabled={isFullscreen}
                    >
                        <option value="desktop">桌面</option>
                        <option value="tablet">平板</option>
                        <option value="mobile">手机</option>
                    </select>
                    <button
                        onClick={handleRefresh}
                        disabled={!currentUrl || isLoading}
                        className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="刷新预览"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001a7.5 7.5 0 01-1.08 3.904l-4.066-2.103a5.992 5.992 0 00.001-3.622zm-2.14 5.352a5.975 5.975 0 01-2.134.089 7.5 7.5 0 01-1.08-3.904h-4.992v.001a7.5 7.5 0 011.08-3.904l4.066 2.103a5.992 5.992 0 00-.001 3.622zm6.163-3.563a.75.75 0 01.217.54V12a.75.75 0 01-.217.54l-2.096 1.048a.75.75 0 01-1.08-.54V9a.75.75 0 011.08-.54l2.096-1.048a.75.75 0 01.863.001z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0 4.142-3.358 7.5-7.5 7.5s-7.5-3.358-7.5-7.5S8.858 4.5 12 4.5s7.5 3.358 7.5 7.5z" />
                        </svg>
                    </button>
                    <button
                        onClick={handleToggleFullscreen}
                        className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-gray-100"
                        title={isFullscreen ? "退出全屏" : "全屏"}
                    >
                        {isFullscreen ? (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9.75 9.75M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9.75 14.25M16.5 3.75h4.5m-4.5 0v4.5m0-4.5L14.25 9.75M16.5 20.25h4.5m-4.5 0v-4.5m0 4.5L14.25 14.25" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>
            <div className={`flex-grow relative bg-gray-900 ${deviceSize !== 'desktop' && !isFullscreen ? 'flex items-center justify-center p-4' : ''}`}>
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-80 z-20">
                        <p className="text-lg">正在加载预览...</p>
                    </div>
                )}
                {currentUrl ? (
                    <iframe
                        ref={iframeRef}
                        src={currentUrl}
                        title={`Game Preview - ${projectId}`}
                        className={`${getIframeSizeClass()} border-0 transition-all duration-300 ease-in-out bg-white`}
                        onLoad={handleIframeLoad}
                        onError={handleIframeError}
                        sandbox="allow-scripts allow-same-origin allow-forms" // Security measure
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <p className="text-gray-500 text-center p-4">选择一个模板或等待游戏生成以预览。</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GamePreviewPanel;
