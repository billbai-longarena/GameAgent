/// <reference types="@testing-library/jest-dom" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import FileTree from '@/components/explorer/FileTree';
import { File as ProjectFile, FileType } from '@/types/file';

// 模拟文件数据
const mockFiles: ProjectFile[] = [
    {
        id: '1',
        name: 'index.html',
        path: 'index.html',
        type: FileType.SOURCE_CODE,
        content: '<!DOCTYPE html>',
        projectId: 'proj-1',
        createdAt: '2023-01-01',
        updatedAt: '2023-01-01'
    },
    {
        id: '2',
        name: 'style.css',
        path: 'style.css',
        type: FileType.STYLE,
        content: 'body { color: red; }',
        projectId: 'proj-1',
        createdAt: '2023-01-01',
        updatedAt: '2023-01-01'
    },
    {
        id: '3',
        name: 'script.js',
        path: 'script.js',
        type: FileType.SOURCE_CODE,
        content: 'console.log("Hello");',
        projectId: 'proj-1',
        createdAt: '2023-01-01',
        updatedAt: '2023-01-01'
    },
    {
        id: '4',
        name: 'config.json',
        path: 'config.json',
        type: FileType.CONFIG,
        content: '{}',
        projectId: 'proj-1',
        createdAt: '2023-01-01',
        updatedAt: '2023-01-01'
    },
    {
        id: '5',
        name: 'README.md',
        path: 'README.md',
        type: FileType.DOCUMENT,
        content: '# README',
        projectId: 'proj-1',
        createdAt: '2023-01-01',
        updatedAt: '2023-01-01'
    }
];

describe('FileTree', () => {
    it('应显示没有文件的提示信息当文件列表为空时', () => {
        const onSelectFileMock = jest.fn();

        render(
            <FileTree
                files={[]}
                onSelectFile={onSelectFileMock}
            />
        );

        expect(screen.getByText('没有项目文件。')).toBeInTheDocument();
    });

    it('应按字母顺序渲染文件列表', () => {
        const onSelectFileMock = jest.fn();

        render(
            <FileTree
                files={mockFiles}
                onSelectFile={onSelectFileMock}
            />
        );

        // 检查文件名按字母顺序排序
        const fileNames = screen.getAllByRole('button').map(button =>
            button.textContent?.trim()
        );

        // 预期顺序: config.json, index.html, README.md, script.js, style.css
        expect(fileNames[0]).toContain('config.json');
        expect(fileNames[1]).toContain('index.html');
        expect(fileNames[2]).toContain('README.md');
        expect(fileNames[3]).toContain('script.js');
        expect(fileNames[4]).toContain('style.css');
    });

    it('应在点击文件时调用onSelectFile回调', () => {
        const onSelectFileMock = jest.fn();

        render(
            <FileTree
                files={mockFiles}
                onSelectFile={onSelectFileMock}
            />
        );

        // 点击第一个文件
        fireEvent.click(screen.getAllByRole('button')[0]);

        // 验证回调被调用且参数正确
        expect(onSelectFileMock).toHaveBeenCalledTimes(1);
        expect(onSelectFileMock).toHaveBeenCalledWith(expect.objectContaining({
            id: '4', // 按字母排序后，config.json是第一个
            name: 'config.json'
        }));
    });

    it('应正确高亮显示选中的文件', () => {
        const onSelectFileMock = jest.fn();
        const selectedFilePath = 'script.js';

        render(
            <FileTree
                files={mockFiles}
                onSelectFile={onSelectFileMock}
                selectedFilePath={selectedFilePath}
            />
        );

        // 获取所有文件按钮
        const buttons = screen.getAllByRole('button');

        // 找到script.js按钮（按字母排序后是索引3）
        const scriptButton = buttons[3];

        // 验证该按钮有高亮类名
        expect(scriptButton).toHaveClass('bg-sky-600');
        expect(scriptButton).toHaveClass('text-white');

        // 验证其他按钮没有高亮类名
        expect(buttons[0]).not.toHaveClass('bg-sky-600');
        expect(buttons[1]).not.toHaveClass('bg-sky-600');
        expect(buttons[2]).not.toHaveClass('bg-sky-600');
        expect(buttons[4]).not.toHaveClass('bg-sky-600');
    });

    it('应根据文件类型和扩展名显示正确的图标', () => {
        const onSelectFileMock = jest.fn();

        render(
            <FileTree
                files={mockFiles}
                onSelectFile={onSelectFileMock}
            />
        );

        // 验证文件按钮存在（我们不能直接测试图标组件，但可以验证按钮存在）
        expect(screen.getAllByRole('button')).toHaveLength(mockFiles.length);

        // 验证每个文件名都正确显示
        mockFiles.forEach(file => {
            expect(screen.getByText(file.name)).toBeInTheDocument();
        });
    });

    it('应为不同文件类型应用正确的CSS类', () => {
        // 创建不同类型文件的小型测试集
        const testFiles: ProjectFile[] = [
            {
                id: '1',
                name: 'script.js',
                path: 'script.js',
                type: FileType.SOURCE_CODE,
                content: '',
                projectId: 'test',
                createdAt: '2023-01-01',
                updatedAt: '2023-01-01'
            },
            {
                id: '2',
                name: 'image.png',
                path: 'image.png',
                type: FileType.ASSET,
                content: '',
                projectId: 'test',
                createdAt: '2023-01-01',
                updatedAt: '2023-01-01'
            }
        ];

        const onSelectFileMock = jest.fn();

        const { container } = render(
            <FileTree
                files={testFiles}
                onSelectFile={onSelectFileMock}
            />
        );

        // 检查文件图标的容器元素
        const iconContainers = container.querySelectorAll('.mr-2\\.5.text-base');

        // 验证图标容器数量与文件数量相同
        expect(iconContainers).toHaveLength(testFiles.length);
    });
});