import '@testing-library/jest-dom';

// 扩展Jest的Matchers类型，解决测试文件中的TypeScript类型错误
declare global {
    namespace jest {
        interface Matchers<R> {
            // 基本匹配器
            toBe(expected: any): R;
            toEqual(expected: any): R;
            toStrictEqual(expected: any): R;
            toBeNull(): R;
            toBeUndefined(): R;
            toBeDefined(): R;
            toBeTruthy(): R;
            toBeFalsy(): R;
            toBeNaN(): R;
            toBeGreaterThan(expected: number | bigint): R;
            toBeGreaterThanOrEqual(expected: number | bigint): R;
            toBeLessThan(expected: number | bigint): R;
            toBeLessThanOrEqual(expected: number | bigint): R;
            toBeInstanceOf(expected: Function): R;
            toMatch(expected: string | RegExp): R;
            toMatchObject(expected: object): R;
            toContain(expected: any): R;
            toContainEqual(expected: any): R;
            toHaveLength(expected: number): R;
            toHaveProperty(keyPath: string, value?: any): R;
            toBeCloseTo(expected: number, precision?: number): R;
            toThrow(expected?: string | Error | RegExp): R;
            toThrowError(expected?: string | Error | RegExp): R;

            // Jest DOM 特定匹配器
            toBeInTheDocument(): R;
            toBeVisible(): R;
            toBeDisabled(): R;
            toBeEnabled(): R;
            toBeEmpty(): R;
            toBeChecked(): R;
            toHaveAttribute(attr: string, value?: any): R;
            toHaveClass(...classNames: string[]): R;
            toHaveStyle(css: string): R;
            toHaveTextContent(text: string | RegExp): R;
            toHaveValue(value: any): R;
            toHaveFocus(): R;

            // Mock 函数匹配器
            toHaveBeenCalled(): R;
            toHaveBeenCalledTimes(expected: number): R;
            toHaveBeenCalledWith(...args: any[]): R;
            toHaveBeenLastCalledWith(...args: any[]): R;
            toHaveBeenNthCalledWith(nthCall: number, ...args: any[]): R;
            toHaveReturned(): R;
            toHaveReturnedTimes(expected: number): R;
            toHaveReturnedWith(expected: any): R;
            toHaveLastReturnedWith(expected: any): R;
            toHaveNthReturnedWith(nthCall: number, expected: any): R;
        }
    }

    // 扩展 expect 静态方法
    interface ExpectStatic {
        extend(matchers: Record<string, any>): void;
        anything(): any;
        any(constructor: Function): any;
        stringContaining(expected: string): any;
        stringMatching(expected: string | RegExp): any;
        objectContaining(expected: object): any;
        arrayContaining(expected: any[]): any;
        assertions(expected: number): void;
    }
}