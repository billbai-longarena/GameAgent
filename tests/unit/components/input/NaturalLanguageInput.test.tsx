/// <reference types="@testing-library/jest-dom" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import NaturalLanguageInput from '@/components/input/NaturalLanguageInput';

// 模拟crypto.randomUUID用于测试
const originalRandomUUID = crypto.randomUUID;
beforeAll(() => {
    crypto.randomUUID = jest.fn(() => 'test-uuid');
});

afterAll(() => {
    crypto.randomUUID = originalRandomUUID;
});

describe('NaturalLanguageInput', () => {
    it('应渲染输入区域和发送按钮', () => {
        const mockSendMessage = jest.fn();
        render(<NaturalLanguageInput onSendMessage={mockSendMessage} />);

        // 验证输入区域存在
        const textArea = screen.getByPlaceholderText('输入您的指令...');
        expect(textArea).toBeInTheDocument();

        // 验证发送按钮存在
        const sendButton = screen.getByText('发送');
        expect(sendButton).toBeInTheDocument();
    });

    it('应在用户输入时更新输入文本', () => {
        const mockSendMessage = jest.fn();
        render(<NaturalLanguageInput onSendMessage={mockSendMessage} />);

        // 获取输入区域
        const textArea = screen.getByPlaceholderText('输入您的指令...') as HTMLTextAreaElement;

        // 模拟用户输入
        fireEvent.change(textArea, { target: { value: '创建一个测试游戏' } });

        // 验证输入文本已更新
        expect(textArea.value).toBe('创建一个测试游戏');
    });

    it('应在点击发送按钮时调用onSendMessage回调', () => {
        const mockSendMessage = jest.fn();
        render(<NaturalLanguageInput onSendMessage={mockSendMessage} />);

        // 获取输入区域和发送按钮
        const textArea = screen.getByPlaceholderText('输入您的指令...');
        const sendButton = screen.getByText('发送');

        // 模拟用户输入和点击发送按钮
        fireEvent.change(textArea, { target: { value: '创建一个测试游戏' } });
        fireEvent.click(sendButton);

        // 验证回调被调用且文本被清空
        expect(mockSendMessage).toHaveBeenCalledWith('创建一个测试游戏');
        expect((textArea as HTMLTextAreaElement).value).toBe('');
    });

    it('应在按Enter键时发送消息', () => {
        const mockSendMessage = jest.fn();
        render(<NaturalLanguageInput onSendMessage={mockSendMessage} />);

        // 获取输入区域
        const textArea = screen.getByPlaceholderText('输入您的指令...');

        // 模拟用户输入和按Enter键
        fireEvent.change(textArea, { target: { value: '创建一个测试游戏' } });
        fireEvent.keyPress(textArea, { key: 'Enter', code: 'Enter', charCode: 13 });

        // 验证回调被调用且文本被清空
        expect(mockSendMessage).toHaveBeenCalledWith('创建一个测试游戏');
        expect((textArea as HTMLTextAreaElement).value).toBe('');
    });

    it('应在按Shift+Enter键时不发送消息', () => {
        const mockSendMessage = jest.fn();
        render(<NaturalLanguageInput onSendMessage={mockSendMessage} />);

        // 获取输入区域
        const textArea = screen.getByPlaceholderText('输入您的指令...');

        // 模拟用户输入和按Shift+Enter键
        fireEvent.change(textArea, { target: { value: '创建一个测试游戏' } });
        fireEvent.keyPress(textArea, { key: 'Enter', code: 'Enter', charCode: 13, shiftKey: true });

        // 验证回调没有被调用且文本没有被清空
        expect(mockSendMessage).not.toHaveBeenCalled();
        expect((textArea as HTMLTextAreaElement).value).toBe('创建一个测试游戏');
    });

    it('应在isProcessing为true时禁用输入区域和发送按钮', () => {
        const mockSendMessage = jest.fn();
        render(<NaturalLanguageInput onSendMessage={mockSendMessage} isProcessing={true} />);

        // 获取输入区域和发送按钮
        const textArea = screen.getByPlaceholderText('输入您的指令...') as HTMLTextAreaElement;
        const sendButton = screen.getByText('发送') as HTMLButtonElement;

        // 验证输入区域和发送按钮被禁用
        expect(textArea.disabled).toBe(true);
        expect(sendButton.disabled).toBe(true);
    });

    it('应当不发送空消息', () => {
        const mockSendMessage = jest.fn();
        render(<NaturalLanguageInput onSendMessage={mockSendMessage} />);

        // 获取输入区域和发送按钮
        const textArea = screen.getByPlaceholderText('输入您的指令...');
        const sendButton = screen.getByText('发送');

        // 尝试发送空消息
        fireEvent.change(textArea, { target: { value: '   ' } });
        fireEvent.click(sendButton);

        // 验证回调没有被调用
        expect(mockSendMessage).not.toHaveBeenCalled();
    });

    it('应当在初始状态下禁用发送按钮', () => {
        const mockSendMessage = jest.fn();
        render(<NaturalLanguageInput onSendMessage={mockSendMessage} />);

        // 获取发送按钮
        const sendButton = screen.getByText('发送') as HTMLButtonElement;

        // 验证发送按钮在初始状态下被禁用（因为输入为空）
        expect(sendButton.disabled).toBe(true);
    });
});