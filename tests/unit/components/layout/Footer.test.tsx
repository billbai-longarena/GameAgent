/// <reference types="@testing-library/jest-dom" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Footer from '@/components/layout/Footer';

describe('Footer', () => {
    // 模拟Date对象以固定年份为2025
    const originalDate = global.Date;

    // 创建一个固定日期的实例，避免递归调用
    const fixedDateInstance = new originalDate('2025-01-01T00:00:00Z');
    const mockDate = jest.fn(() => fixedDateInstance);
    mockDate.now = jest.fn(() => 1735689600000); // 2025-01-01 in milliseconds

    beforeAll(() => {
        global.Date = mockDate as any;
    });

    afterAll(() => {
        global.Date = originalDate;
    });

    it('应渲染页脚和版权信息', () => {
        render(<Footer />);

        // 验证版权信息包含当前年份
        const copyrightText = screen.getByText(/2025 GameAgent\. All rights reserved\./i);
        expect(copyrightText).toBeInTheDocument();

        // 验证footer元素存在并有正确的类名
        const footerElement = copyrightText.closest('footer');
        expect(footerElement).toBeInTheDocument();
        expect(footerElement).toHaveClass('bg-gray-800');
        expect(footerElement).toHaveClass('text-white');
        expect(footerElement).toHaveClass('text-center');
    });

    it('应在容器中包含版权信息', () => {
        const { container } = render(<Footer />);

        // 验证容器div存在并有正确的类名
        const containerDiv = container.querySelector('.container');
        expect(containerDiv).toBeInTheDocument();
        expect(containerDiv).toHaveClass('mx-auto');

        // 验证版权信息在p标签内
        const paragraphElement = screen.getByText(/GameAgent\. All rights reserved\./i);
        expect(paragraphElement.tagName).toBe('P');
    });

    it('应显示当前年份', () => {
        render(<Footer />);

        // 验证年份显示在版权信息中
        const currentYear = new Date().getFullYear().toString();
        expect(screen.getByText(new RegExp(currentYear, 'i'))).toBeInTheDocument();
    });
});