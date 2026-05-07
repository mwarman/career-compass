import type { Config } from 'jest';

const config: Config = {
  displayName: 'shared',
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: './src',
  testMatch: ['**/__tests__/**/*.ts', '**/*.test.ts', '**/*.spec.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverageFrom: ['**/*.ts', '!**/*.d.ts', '!**/node_modules/**', '!**/dist/**'],
  coveragePathIgnorePatterns: ['/node_modules/', '/dist/'],
};

export default config;
