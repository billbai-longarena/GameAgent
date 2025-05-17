/// <reference types="@testing-library/jest-dom" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Header from '@/components/layout/Header';

describe('Header', () => {
    it('应渲染带有应用名称的标题栏', () => {
        render(<Header />);

        // 验证标题存在
        const headerElement = screen.getByText('GameAgent');
        expect(headerElement).toBeInTheDocument();
        expect(headerElement.tagName).toBe('H1');

        // 验证header元素存在并有正确的类名
        const headerContainer = headerElement.closest('header');
        expect(headerContainer).toBeInTheDocument();
        expect(headerContainer).toHaveClass('bg-gray-800');
        expect(headerContainer).toHaveClass('text-white');
    });

    it('应应用正确的样式类名', () => {
        const { container } = render(<Header />);

        // 验证容器div存在并有正确的类名
        const containerDiv = container.querySelector('.container');
        expect(containerDiv).toBeInTheDocument();
        expect(containerDiv).toHaveClass('mx-auto');

        // 验证h1标题有正确的类名
        const headerTitle = screen.getByText('GameAgent');
        expect(headerTitle).toHaveClass('text-xl');
        expect(headerTitle).toHaveClass('font-bold');
    });
});