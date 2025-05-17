// jest.config.js
const nextJest = require('next/jest');

const createJestConfig = nextJest({
    // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
    dir: './',
});

// Add any custom config to be passed to Jest
/** @type {import('jest').Config} */
const customJestConfig = {
    // Add more setup options before each test is run
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'], // Uncommented this line

    testEnvironment: 'jest-environment-jsdom',
    moduleNameMapper: {
        // Handle module aliases (this will be automatically configured for you soon)
        '^@/components/(.*)$': '<rootDir>/src/components/$1',
        '^@/types/(.*)$': '<rootDir>/src/types/$1',
        '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
        '^@/services/(.*)$': '<rootDir>/src/services/$1',
        // Add other aliases here if needed
    },
    transform: {
        // Use ts-jest for .ts/.tsx files
        '^.+\\.(ts|tsx)$': ['ts-jest', {
            tsconfig: 'tsconfig.jest.json', // Use a separate tsconfig for Jest if needed
        }],
    },
    // 允许处理 node_modules 中的 uuid 模块的 ES 模块语法
    transformIgnorePatterns: [
        '/node_modules/(?!uuid)/',
    ],
    // Indicates whether the coverage information should be collected while executing the test
    // collectCoverage: true,

    // An array of glob patterns indicating a set of files for which coverage information should be collected
    // collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts'],

    // The directory where Jest should output its coverage files
    // coverageDirectory: "coverage",
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);