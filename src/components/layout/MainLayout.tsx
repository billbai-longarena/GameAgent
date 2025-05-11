import React, { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer'; // Footer might be integrated into StatusControlBar or removed for workspace view
import NaturalLanguageInput from '@/components/input/NaturalLanguageInput';
import StatusControlBar from '@/components/control/StatusControlBar';
import { AgentState, AgentStatus, DevelopmentStage } from '@/types/agent'; // For StatusControlBar props

// Dummy props for components that will be part of the page content
// These would normally come from page-level state management (e.g., Zustand, Context, Redux)
const dummyAgentState: AgentState = {
    id: 'dummy-agent',
    projectId: 'dummy-project',
    currentTask: 'Idle',
    thinking: 'Waiting for instructions...',
    action: { type: 'idle', description: 'Agent is idle', timestamp: new Date() },
    stage: DevelopmentStage.CODING, // Example stage
    progress: 0,
    status: AgentStatus.IDLE,
    logs: [],
    estimatedTimeRemaining: 0,
};

interface MainLayoutProps {
    children: ReactNode; // This will be the central workspace area (Explorer, AgentWorkspace, Preview)
    // Props for components managed by MainLayout itself
    onSendMessage: (message: string) => void; // For NaturalLanguageInput
    agentStatus: AgentStatus;
    currentStage: DevelopmentStage;
    progress: number;
    estimatedTimeRemaining: number;
    onPauseAgent: () => void;
    onResumeAgent: () => void;
    onStopAgent: () => void;
}

const MainLayout: React.FC<MainLayoutProps> = ({
    children,
    onSendMessage,
    agentStatus,
    currentStage,
    progress,
    estimatedTimeRemaining,
    onPauseAgent,
    onResumeAgent,
    onStopAgent,
}) => {
    return (
        <div className="flex flex-col h-screen bg-gray-900 text-white overflow-hidden">
            <Header />

            {/* Natural Language Input Area */}
            <div className="shrink-0"> {/* Prevents this area from shrinking too much */}
                <NaturalLanguageInput
                    onSendMessage={onSendMessage}
                    isProcessing={agentStatus !== AgentStatus.IDLE && agentStatus !== AgentStatus.COMPLETED && agentStatus !== AgentStatus.PAUSED && agentStatus !== AgentStatus.ERROR}
                />
            </div>

            {/* Main Workspace Area - passed as children */}
            <main className="flex-grow flex overflow-hidden">
                {children}
            </main>

            {/* Status Control Bar Area */}
            <div className="shrink-0"> {/* Prevents this area from shrinking */}
                <StatusControlBar
                    agentStatus={agentStatus}
                    currentStage={currentStage}
                    progress={progress}
                    estimatedTimeRemaining={estimatedTimeRemaining}
                    onPause={onPauseAgent}
                    onResume={onResumeAgent}
                    onStop={onStopAgent}
                />
            </div>
            {/* Footer can be optional or integrated if design requires */}
            {/* <Footer /> */}
        </div>
    );
};

export default MainLayout;
