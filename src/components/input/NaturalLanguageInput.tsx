'use client';

import React, { useState, KeyboardEvent } from 'react';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'agent';
    timestamp: Date;
}

interface NaturalLanguageInputProps {
    onSendMessage: (messageText: string) => void;
    isProcessing?: boolean; // To disable input/button while agent is working
}

const NaturalLanguageInput: React.FC<NaturalLanguageInputProps> = ({
    onSendMessage,
    isProcessing = false,
}) => {
    const [inputText, setInputText] = useState('');
    const [messageHistory, setMessageHistory] = useState<Message[]>([]); // Placeholder for history

    const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInputText(event.target.value);
    };

    const handleSubmit = () => {
        if (inputText.trim() && !isProcessing) {
            onSendMessage(inputText.trim());
            // Add to history (example)
            setMessageHistory(prev => [
                ...prev,
                { id: crypto.randomUUID(), text: inputText.trim(), sender: 'user', timestamp: new Date() }
            ]);
            setInputText('');
        }
    };

    const handleKeyPress = (event: KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault(); // Prevent new line on Enter
            handleSubmit();
        }
    };

    // Placeholder for quick commands
    const quickCommands = [
        { id: 'qc1', label: '创建新游戏', command: '创建一个简单的问答游戏关于太阳系。' },
        { id: 'qc2', label: '解释代码', command: '解释一下 AgentController 的 start 方法。' },
    ];

    return (
        <div className="flex flex-col p-4 border-t border-gray-700 bg-gray-800 text-white">
            {/* Message History Area - Placeholder */}
            <div className="flex-grow h-40 overflow-y-auto mb-2 p-2 border border-gray-600 rounded bg-gray-700 hidden">
                {messageHistory.map((msg) => (
                    <div key={msg.id} className={`mb-1 p-1 rounded text-sm ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                        <span className={`px-2 py-1 inline-block rounded ${msg.sender === 'user' ? 'bg-blue-600' : 'bg-gray-600'}`}>
                            {msg.text}
                        </span>
                    </div>
                ))}
                {/* This history is local to the component for now, will need to be managed globally */}
            </div>

            <div className="flex items-start space-x-2">
                <textarea
                    value={inputText}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    placeholder="输入您的指令，例如：创建一个关于恐龙的问答游戏..."
                    className="flex-grow p-3 text-sm bg-gray-700 border border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 resize-none placeholder-gray-400"
                    rows={3}
                    disabled={isProcessing}
                />
                <button
                    onClick={handleSubmit}
                    disabled={isProcessing || !inputText.trim()}
                    className="px-6 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-800 disabled:bg-gray-500 disabled:cursor-not-allowed"
                >
                    发送
                </button>
            </div>

            {/* Quick Commands Area - Placeholder */}
            <div className="mt-2 flex space-x-2 hidden">
                <span className="text-xs text-gray-400 pt-1">快捷指令:</span>
                {quickCommands.map(cmd => (
                    <button
                        key={cmd.id}
                        onClick={() => {
                            setInputText(cmd.command);
                            // Optionally auto-send: handleSubmit(); or focus textarea
                        }}
                        disabled={isProcessing}
                        className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-500 rounded disabled:bg-gray-700 disabled:text-gray-500"
                    >
                        {cmd.label}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default NaturalLanguageInput;
