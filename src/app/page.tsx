'use client';

import React, { useState, useEffect, useCallback } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import ProjectExplorerPanel from '@/components/explorer/ProjectExplorerPanel';
import AIConversationHistoryPanel from '@/components/workspace/AIConversationHistoryPanel';
import { AgentState, AgentStatus, DevelopmentStage, ActionType, LogLevel } from '@/types/agent';
import { FileChange, FileType } from '@/types/file'; // Removed ProjectFile import as it's not directly used here for the list
import { GameListItem } from '@/types/game'; // Import GameListItem
import io, { Socket } from 'socket.io-client';
import GamePreviewPanel from '@/components/preview/GamePreviewPanel';
import { FiMessageSquare, FiMonitor, FiFolder } from 'react-icons/fi'; // Icons for toggles

// Dummy data for initial rendering
const initialAgentState: AgentState = {
  id: 'project-123',
  projectId: 'project-123',
  currentTask: '等待指令...',
  thinking: 'Agent 已准备就绪。',
  action: { type: ActionType.IDLE, description: 'Agent is idle', timestamp: new Date() },
  stage: DevelopmentStage.CODING,
  progress: 0,
  status: AgentStatus.IDLE,
  logs: [{ id: 'log1', message: 'Agent initialized.', level: LogLevel.INFO, timestamp: new Date() }],
  thoughtProcess: [{
    id: crypto.randomUUID(),
    stage: ActionType.INITIALIZE,
    description: 'Agent initialized and ready.',
    status: 'completed',
    timestamp: new Date().toISOString(),
  }],
  estimatedTimeRemaining: 0,
};

// Initial mock game items, including templates and a placeholder for a generated game
const initialGameList: GameListItem[] = [
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
  // Example of a generated game item (would be added dynamically)
  // {
  //   id: 'generated-game-1',
  //   name: '我的第一个AI生成游戏',
  //   description: '这是一个通过自然语言指令生成的游戏。',
  //   entryPoint: '/generated_games/project-123/my-first-ai-game/index.html', // Example path
  //   previewImageUrl: '/generated_games/project-123/my-first-ai-game/preview.png', // Example path
  //   isGenerated: true,
  //   generatedAt: new Date().toISOString(),
  //   tags: ['AI生成'],
  // },
];


export default function HomePage() {
  const [agentState, setAgentState] = useState<AgentState>(initialAgentState);
  const [gameList, setGameList] = useState<GameListItem[]>(initialGameList);
  const [fileChanges, setFileChanges] = useState<FileChange[]>([]); // Keep for file change panel if needed elsewhere
  const [socket, setSocket] = useState<Socket | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const currentProjectId = 'project-123'; // Should be dynamic in a real app

  // States for panel visibility on small screens
  const [showAIHistoryPanel, setShowAIHistoryPanel] = useState(true); // Default to true for small screens
  const [showGamePreviewPanel, setShowGamePreviewPanel] = useState(false);
  const [showFilesPanel, setShowFilesPanel] = useState(false); // This now controls "Game List" panel

  const handlePreviewGame = useCallback((gameUrl: string) => {
    const fullUrl = gameUrl.startsWith('/') ? gameUrl : `/${gameUrl}`;
    console.log(`Previewing game: ${fullUrl}`);
    setPreviewUrl(fullUrl);
    // On small screens, automatically switch to the preview panel when a game is selected
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setShowGamePreviewPanel(true);
      setShowAIHistoryPanel(false);
      setShowFilesPanel(false);
    }
  }, []);

  // WebSocket connection and event listeners
  useEffect(() => {
    if (typeof window !== "undefined") {
      const newSocket: Socket = io("http://localhost:3000/agent", {
        transports: ["websocket"],
        query: { projectId: currentProjectId }
      });
      setSocket(newSocket);

      newSocket.on("connect", () => console.log("Connected to WebSocket server for project:", currentProjectId));
      newSocket.on("disconnect", (reason: Socket.DisconnectReason) => console.log("Disconnected from WebSocket server:", reason));
      newSocket.on("connect_error", (err: Error) => console.error("WebSocket connection error:", err.message));

      // Agent state updates
      newSocket.on('agent:state', (newState: AgentState) => {
        console.log('Received agent:state update:', newState);
        setAgentState(newState);
      });
      newSocket.on('agent:thinking', (data: { thinking: string }) => setAgentState(prev => ({ ...prev, thinking: data.thinking })));
      newSocket.on('agent:action', (data: { action: AgentState['action'] }) => setAgentState(prev => ({ ...prev, action: data.action })));
      newSocket.on('agent:progress', (data: { stage: DevelopmentStage, progress: number, timeRemaining: number }) =>
        setAgentState(prev => ({ ...prev, stage: data.stage, progress: data.progress, estimatedTimeRemaining: data.timeRemaining }))
      );
      newSocket.on('agent:log', (data: { log: AgentState['logs'][0] }) =>
        setAgentState(prev => ({ ...prev, logs: [...(prev.logs || []), data.log].slice(-100) }))
      );
      newSocket.on('agent:thoughtProcessUpdate', (data: { thoughtProcess: AgentState['thoughtProcess'] }) => {
        setAgentState(prev => ({ ...prev, thoughtProcess: data.thoughtProcess }));
      });

      // File updates (can be kept if FileChangesPanel is still used, or simplified if not)
      // For now, we'll keep them as they might be useful for the FileChangesPanel.
      // If ProjectExplorerPanel no longer shows individual files, these might not directly update that panel.
      newSocket.on('file:created', (data: { file: { id: string, name: string, path: string, type: FileType, content: string } }) => {
        console.log('File created (event):', data.file);
        // This no longer directly updates ProjectExplorerPanel's file list,
        // but FileChangesPanel might still use this.
        const newChange: FileChange = {
          id: crypto.randomUUID(), operation: 'create', file: data.file,
          diff: `+ ${data.file.name}`, timestamp: new Date().toISOString(),
        };
        setFileChanges(prev => [...prev, newChange].slice(-20));
      });
      newSocket.on('file:updated', (data: { fileId: string, changes: any, file?: { id: string, name: string, path: string } }) => {
        console.log('File updated (event):', data);
        const updatedFileDisplay = data.file ? { id: data.file.id, path: data.file.path, name: data.file.name } : { id: data.fileId, path: data.fileId, name: 'Unknown File' };
        const newChange: FileChange = {
          id: crypto.randomUUID(), operation: 'update', file: updatedFileDisplay,
          diff: typeof data.changes === 'string' ? data.changes : JSON.stringify(data.changes),
          timestamp: new Date().toISOString(),
        };
        setFileChanges(prev => [...prev, newChange].slice(-20));
      });
      newSocket.on('file:deleted', (data: { fileId: string, filePath?: string }) => {
        console.log('File deleted (event):', data.fileId);
        const newChange: FileChange = {
          id: crypto.randomUUID(), operation: 'delete',
          file: { id: data.fileId, path: data.filePath || data.fileId, name: data.filePath || data.fileId },
          timestamp: new Date().toISOString(),
        };
        setFileChanges(prev => [...prev, newChange].slice(-20));
      });

      // Game generated event - NEW
      newSocket.on('game:generated', (newGame: GameListItem) => {
        console.log('New game generated:', newGame);
        setGameList(prev => [newGame, ...prev]); // Add new game to the top of the list
        // Optionally, auto-preview the new game
        // handlePreviewGame(newGame.entryPoint);
      });

      // Preview updates (can be for templates or generated games)
      newSocket.on('preview:updated', (data: { projectId: string, url: string }) => {
        if (data.projectId === currentProjectId) {
          console.log('Received preview:updated event:', data.url);
          setPreviewUrl(data.url);
        }
      });

      return () => {
        console.log("Disconnecting WebSocket...");
        newSocket.disconnect();
      };
    }
  }, [currentProjectId]); // Only re-run if projectId changes

  // Fetch initial state (optional, if WebSocket provides it on connect)
  useEffect(() => {
    const fetchAgentState = async () => {
      try {
        const response = await fetch(`/api/agent/status?projectId=${currentProjectId}`);
        if (response.ok) {
          const data: AgentState = await response.json();
          setAgentState(data);
        } else {
          console.error('Failed to fetch initial agent state:', response.statusText);
        }
      } catch (error) {
        console.error('Error fetching initial agent state:', error);
      }
    };
    // fetchAgentState(); // Uncomment if needed
  }, [currentProjectId]);

  const handleSendMessage = useCallback(async (messageText: string) => {
    console.log('Sending message to agent:', messageText);
    setAgentState(prev => ({ ...prev, status: AgentStatus.THINKING, thinking: `Processing: ${messageText}` }));
    // On small screens, ensure AI panel is visible and others are not when sending a message
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setShowAIHistoryPanel(true);
      setShowGamePreviewPanel(false);
      setShowFilesPanel(false);
    }
    try {
      const response = await fetch('/api/agent/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: currentProjectId, action: 'start', instruction: messageText }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to send message to agent:', errorData);
        setAgentState(prev => ({ ...prev, status: AgentStatus.ERROR, thinking: `Error: ${errorData.error || 'Failed to start agent'}` }));
      }
    } catch (error) {
      console.error('Error sending message to agent:', error);
      setAgentState(prev => ({ ...prev, status: AgentStatus.ERROR, thinking: `Error: ${(error as Error).message}` }));
    }
  }, [currentProjectId]);

  const handleAgentControl = useCallback(async (controlAction: 'pause' | 'resume' | 'stop') => {
    console.log(`Sending control action: ${controlAction}`);
    try {
      const response = await fetch('/api/agent/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: currentProjectId, action: controlAction }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.error(`Failed to ${controlAction} agent:`, errorData);
      }
    } catch (error) {
      console.error(`Error sending ${controlAction} to agent:`, error);
    }
  }, [currentProjectId]);

  // Toggle functions are no longer needed as buttons are removed.
  // Panel visibility on small screens is now controlled by other interactions
  // like handlePreviewGame or handleSendMessage.

  return (
    <MainLayout
      onSendMessage={handleSendMessage}
      agentStatus={agentState.status}
      currentStage={agentState.stage}
      progress={agentState.progress}
      estimatedTimeRemaining={agentState.estimatedTimeRemaining}
      onPauseAgent={() => handleAgentControl('pause')}
      onResumeAgent={() => handleAgentControl('resume')}
      onStopAgent={() => handleAgentControl('stop')}
    >
      {/* Main content area using Flexbox and Tailwind responsive classes */}
      <div className="flex flex-col h-full w-full overflow-hidden">

        {/* Toggle buttons for small screens are removed */}

        {/* Layout container */}
        <div className="flex flex-1 overflow-hidden p-1 gap-2">
          {/* Left Panel: AI Conversation History */}
          {/* On small screens, visible if showAIHistoryPanel is true. Always visible on md+ */}
          <div className={`
            ${showAIHistoryPanel ? 'block w-full h-full' : 'hidden'}
            md:block md:w-1/3 md:min-w-0 md:h-full overflow-y-auto bg-gray-850 rounded
          `}>
            <AIConversationHistoryPanel
              agentState={agentState}
              fileChanges={fileChanges} // FileChangesPanel is part of AIConversationHistoryPanel
              onSendMessage={handleSendMessage}
            />
          </div>

          {/* Center Panel: Game Preview */}
          {/* On small screens, visible if showGamePreviewPanel is true AND showAIHistoryPanel and showFilesPanel are false. Always visible on md+ */}
          <div className={`
            ${(showAIHistoryPanel || showFilesPanel) ? 'hidden' : showGamePreviewPanel ? 'block w-full h-full' : 'hidden'}
            md:block md:w-1/3 md:min-w-0 md:h-full overflow-y-auto bg-gray-850 rounded
          `}>
            <GamePreviewPanel projectId={currentProjectId} previewUrl={previewUrl} />
          </div>

          {/* Right Panel: Game List (ProjectExplorerPanel repurposed) */}
          {/* On small screens, visible if showFilesPanel is true. Always visible on md+ */}
          <div className={`
            ${showFilesPanel ? 'block w-full h-full' : 'hidden'}
            md:block md:w-1/3 md:min-w-0 md:h-full overflow-y-auto bg-gray-850 rounded
          `}>
            <ProjectExplorerPanel
              gameItems={gameList}
              onPreviewGame={handlePreviewGame}
            />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
