/// &lt;reference types="@testing-library/jest-dom" /&gt;
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import StatusControlBar from '@/components/control/StatusControlBar';
import { AgentStatus, DevelopmentStage } from '@/types/agent';

describe('StatusControlBar', () => {
    // 创建新的mock函数给每个测试使用
    let mockOnPause: jest.Mock;
    let mockOnResume: jest.Mock;
    let mockOnStop: jest.Mock;

    beforeEach(() => {
        // 在每个测试前重置mock函数
        mockOnPause = jest.fn();
        mockOnResume = jest.fn();
        mockOnStop = jest.fn();
    });

    const getMockProps = () => ({
        agentStatus: AgentStatus.IDLE,
        currentStage: DevelopmentStage.CODING,
        progress: 50,
        estimatedTimeRemaining: 300, // 5 minutes
        onPause: mockOnPause,
        onResume: mockOnResume,
        onStop: mockOnStop,
    });

    it('renders correctly with initial props', () => {
        const props = getMockProps();
        render(<StatusControlBar {...props} />);

        // Check for StageIndicator content
        expect(screen.getByText(AgentStatus.IDLE.toUpperCase())).toBeInTheDocument();

        // Check for TimeEstimator content
        expect(screen.getByText('预计剩余:')).toBeInTheDocument();
        expect(screen.getByText('05:00')).toBeInTheDocument(); // 300s = 05:00

        // Check for ProgressIndicator content
        // Access STAGE_DISPLAY_NAMES from the component module or redefine for test
        const STAGE_DISPLAY_NAMES_TEST: Record<DevelopmentStage, string> = {
            [DevelopmentStage.REQUIREMENT_ANALYSIS]: '需求分析',
            [DevelopmentStage.DESIGN]: '设计规划',
            [DevelopmentStage.CODING]: '代码编写',
            [DevelopmentStage.TESTING]: '测试调试',
            [DevelopmentStage.OPTIMIZATION]: '优化完善',
            [DevelopmentStage.COMPLETED]: '已完成',
        };
        expect(screen.getByText('阶段:')).toBeInTheDocument();
        expect(screen.getByText(STAGE_DISPLAY_NAMES_TEST[DevelopmentStage.CODING])).toBeInTheDocument();
        expect(screen.getByText('50%')).toBeInTheDocument();
        const progressBar = screen.getByRole('progressbar');
        expect(progressBar.firstChild).toHaveStyle('width: 50%');

        // Check for ControlButtons (Start button should be "新任务" in IDLE state)
        expect(screen.getByRole('button', { name: /新任务/i })).toBeInTheDocument();
    });

    it('shows Pause and Stop buttons when agent is THINKING', () => {
        const props = getMockProps();
        render(<StatusControlBar {...props} agentStatus={AgentStatus.THINKING} />);
        expect(screen.getByRole('button', { name: /暂停/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /停止/i })).toBeInTheDocument();
    });

    it('shows Resume and Stop buttons when agent is PAUSED', () => {
        const props = getMockProps();
        render(<StatusControlBar {...props} agentStatus={AgentStatus.PAUSED} />);
        expect(screen.getByRole('button', { name: /继续/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /停止/i })).toBeInTheDocument();
    });

    it('calls onPause when Pause button is clicked', () => {
        const props = getMockProps();
        render(<StatusControlBar {...props} agentStatus={AgentStatus.CODING} />);
        fireEvent.click(screen.getByRole('button', { name: /暂停/i }));
        expect(mockOnPause).toHaveBeenCalledTimes(1);
    });

    it('calls onResume when Resume button is clicked', () => {
        const props = getMockProps();
        render(<StatusControlBar {...props} agentStatus={AgentStatus.PAUSED} />);
        fireEvent.click(screen.getByRole('button', { name: /继续/i }));
        expect(mockOnResume).toHaveBeenCalledTimes(1);
    });

    it('calls onStop when Stop button is clicked (during active state)', () => {
        const props = getMockProps();
        render(<StatusControlBar {...props} agentStatus={AgentStatus.CODING} />);
        fireEvent.click(screen.getByRole('button', { name: /停止/i }));
        expect(mockOnStop).toHaveBeenCalledTimes(1);
    });

    it('calls onStop when "新任务" button is clicked (during IDLE state)', () => {
        const props = getMockProps();
        render(<StatusControlBar {...props} agentStatus={AgentStatus.IDLE} />);
        fireEvent.click(screen.getByRole('button', { name: /新任务/i }));
        expect(mockOnStop).toHaveBeenCalledTimes(1); // As per current logic where "新任务" calls onStop
    });

    it('displays stage names correctly in ProgressIndicator', () => {
        const STAGE_DISPLAY_NAMES_TEST: Record<DevelopmentStage, string> = {
            [DevelopmentStage.REQUIREMENT_ANALYSIS]: '需求分析',
            [DevelopmentStage.DESIGN]: '设计规划',
            [DevelopmentStage.CODING]: '代码编写',
            [DevelopmentStage.TESTING]: '测试调试',
            [DevelopmentStage.OPTIMIZATION]: '优化完善',
            [DevelopmentStage.COMPLETED]: '已完成',
        };
        const props = getMockProps();
        render(<StatusControlBar {...props} currentStage={DevelopmentStage.REQUIREMENT_ANALYSIS} />);
        expect(screen.getByText('阶段:')).toBeInTheDocument();
        expect(screen.getByText(STAGE_DISPLAY_NAMES_TEST[DevelopmentStage.REQUIREMENT_ANALYSIS])).toBeInTheDocument();
    });

    it('ControlButtons show "重置" when agent is COMPLETED', () => {
        const props = getMockProps();
        render(<StatusControlBar {...props} agentStatus={AgentStatus.COMPLETED} />);
        expect(screen.getByText('重置')).toBeInTheDocument();
    });

    it('ControlButtons show "重置" when agent is in ERROR state', () => {
        const props = getMockProps();
        render(<StatusControlBar {...props} agentStatus={AgentStatus.ERROR} />);
        expect(screen.getByText('重置')).toBeInTheDocument();
    });

});