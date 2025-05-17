// jest.setup.js
import '@testing-library/jest-dom';

// 为测试环境提供 crypto.randomUUID 实现
if (typeof crypto === 'undefined') {
    global.crypto = {};
}

if (typeof crypto.randomUUID !== 'function') {
    crypto.randomUUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };
}

// 模拟 uuid 模块，避免 ESM 导入问题
jest.mock('uuid', () => ({
    v4: () => 'mocked-uuid-v4'
}));

// You can add other global setup here if needed, for example:
// - Mocking global objects (fetch, localStorage, etc.)
// - Setting up a mock server (e.g., MSW) for API calls
// - Any other environment setup needed for your tests

// Example: Mocking a global function if your components use it
// global.myGlobalFunction = jest.fn();

// Example: Suppress console.error or console.warn for specific known issues during tests
// if (process.env.NODE_ENV === 'test') {
//   const originalError = console.error;
//   console.error = (...args) => {
//     if (typeof args[0] === 'string' && args[0].includes('some known error string to ignore')) {
//       return;
//     }
//     originalError.apply(console, args);
//   };
// }