'use client';

import React, { useState, useEffect, useCallback } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import ProjectExplorerPanel from '@/components/explorer/ProjectExplorerPanel';
import AgentWorkspacePanel from '@/components/workspace/AgentWorkspacePanel';
import { AgentState, AgentStatus, DevelopmentStage, ActionType, LogLevel } from '@/types/agent'; // Added LogLevel
import { File as ProjectFile, FileChange, FileType } from '@/types/file';
import io, { Socket } from 'socket.io-client';

// Dummy data for initial rendering
const initialAgentState: AgentState = {
  id: 'project-123',
  projectId: 'project-123',
  currentTask: '等待指令...',
  thinking: 'Agent 已准备就绪。',
  action: { type: ActionType.IDLE, description: 'Agent is idle', timestamp: new Date() },
  stage: DevelopmentStage.CODING, // Example, should be dynamic
  progress: 0,
  status: AgentStatus.IDLE,
  logs: [{ id: 'log1', message: 'Agent initialized.', level: LogLevel.INFO, timestamp: new Date() }], // Use LogLevel.INFO
  estimatedTimeRemaining: 0,
};

const dummyProjectFiles: ProjectFile[] = [
  { id: 'f1', projectId: 'project-123', name: 'README.md', path: 'README.md', type: FileType.DOCUMENT, content: '# My Game Project', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'f2', projectId: 'project-123', name: 'game.ts', path: 'src/game.ts', type: FileType.SOURCE_CODE, content: 'console.log("Hello Game!");', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'f3', projectId: 'project-123', name: 'styles.css', path: 'src/styles.css', type: FileType.STYLE, content: 'body { margin: 0; }', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

// Placeholder for GamePreviewPanel
const GamePreviewPanelPlaceholder: React.FC = () => (
  <div className="flex-grow p-4 bg-gray-700 rounded-lg shadow flex items-center justify-center">
    <p className="text-gray-400">游戏预览区</p>
  </div>
);

export default function HomePage() {
  const [agentState, setAgentState] = useState<AgentState>(initialAgentState);
  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>(dummyProjectFiles);
  const [fileChanges, setFileChanges] = useState<FileChange[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const currentProjectId = 'project-123'; // Example project ID

  // WebSocket connection and event handling
  useEffect(() => {
    if (typeof window !== "undefined") {
      const newSocket: Socket = io("http://localhost:3000/agent", {
        transports: ["websocket"],
        query: { projectId: currentProjectId }
      });
      setSocket(newSocket);

      newSocket.on("connect", () => {
        console.log("Connected to WebSocket server in /agent namespace for project:", currentProjectId);
        // No need to emit joinRoom if query parameter handles it,
        // but server.ts implementation might require it.
        // newSocket.emit("joinRoom", `project:${currentProjectId}`); 
      });

      newSocket.on("disconnect", (reason: Socket.DisconnectReason) => {
        console.log("Disconnected from WebSocket server:", reason);
      });

      newSocket.on("connect_error", (err: Error) => {
        console.error("WebSocket connection error:", err.message);
      });

      // Listen for agent state updates (assuming a single event for the whole state)
      // This is a simplified assumption. In reality, you might get granular updates.
      newSocket.on('agent:state', (newState: AgentState) => { // Assuming 'agent:state' is the event name
        console.log('Received agent:state update:', newState);
        setAgentState(newState);
      });
      // Fallback: listen to individual parts if no single 'agent:state' event
      newSocket.on('agent:thinking', (data: { thinking: string }) => setAgentState(prev => ({ ...prev, thinking: data.thinking })));
      newSocket.on('agent:action', (data: { action: AgentState['action'] }) => setAgentState(prev => ({ ...prev, action: data.action })));
      newSocket.on('agent:progress', (data: { stage: DevelopmentStage, progress: number, timeRemaining: number }) =>
        setAgentState(prev => ({ ...prev, stage: data.stage, progress: data.progress, estimatedTimeRemaining: data.timeRemaining }))
      );
      newSocket.on('agent:log', (data: { log: AgentState['logs'][0] }) =>
        setAgentState(prev => ({ ...prev, logs: [...prev.logs, data.log].slice(-100) })) // Keep last 100 logs
      );


      // File change events
      newSocket.on('file:created', (data: { file: ProjectFile }) => {
        console.log('File created:', data.file);
        setProjectFiles(prev => [...prev, data.file]);
        const newChange: FileChange = { operation: 'create', file: data.file, diff: `+ ${data.file.name}` };
        setFileChanges(prev => [...prev, newChange].slice(-10));
      });
      newSocket.on('file:updated', (data: { fileId: string, changes: any, file?: ProjectFile }) => { // file might be the full updated file
        console.log('File updated:', data);
        if (data.file) {
          setProjectFiles(prev => prev.map(f => f.id === data.file!.id ? data.file! : f));
        }
        const newChange: FileChange = { operation: 'update', file: { id: data.fileId, path: data.file?.path || data.fileId }, diff: JSON.stringify(data.changes) };
        setFileChanges(prev => [...prev, newChange].slice(-10));
      });
      newSocket.on('file:deleted', (data: { fileId: string }) => {
        console.log('File deleted:', data.fileId);
        const deletedFile = projectFiles.find(f => f.id === data.fileId);
        setProjectFiles(prev => prev.filter(f => f.id !== data.fileId));
        const newChange: FileChange = { operation: 'delete', file: { id: data.fileId, path: deletedFile?.path || data.fileId } };
        setFileChanges(prev => [...prev, newChange].slice(-10));
      });


      return () => {
        console.log("Disconnecting WebSocket...");
        newSocket.disconnect();
      };
    }
  }, [currentProjectId]); // Reconnect if projectId changes

  // Fetch initial agent state
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
    fetchAgentState();
  }, [currentProjectId]);


  const handleSendMessage = useCallback(async (messageText: string) => {
    console.log('Sending message to agent:', messageText);
    setAgentState(prev => ({ ...prev, status: AgentStatus.THINKING, thinking: `Processing: ${messageText}` }));
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
      // Agent state will be updated via WebSocket
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
        // Optionally update local state to reflect error, though WebSocket should be source of truth
      }
      // Agent state will be updated via WebSocket
    } catch (error) {
      console.error(`Error sending ${controlAction} to agent:`, error);
    }
  }, [currentProjectId]);


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
      <div className="flex flex-1 p-1 space-x-1 overflow-hidden">
        {/* Left Panel: Project Explorer */}
        <div className="w-1/5 min-w-[200px] max-w-[300px] shrink-0">
          <ProjectExplorerPanel projectFiles={projectFiles} />
        </div>

        {/* Center Panel: Agent Workspace */}
        <div className="flex-1 flex flex-col min-w-0"> {/* min-w-0 is important for flex children to shrink */}
          <AgentWorkspacePanel agentState={agentState} fileChanges={fileChanges} />
        </div>

        {/* Right Panel: Game Preview (Placeholder) */}
        <div className="w-1/3 min-w-[300px] max-w-[500px] shrink-0">
          <GamePreviewPanelPlaceholder />
        </div>
      </div>
    </MainLayout>
  );
}
