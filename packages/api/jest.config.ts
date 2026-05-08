import type { Config } from 'jest';

const config: Config = {
  displayName: 'api',
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['**/__tests__/**/*.ts', '**/*.test.ts', '**/*.spec.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverageFrom: ['**/*.ts', '!**/*.d.ts', '!**/node_modules/**', '!**/dist/**'],
  coveragePathIgnorePatterns: ['/node_modules/', '/dist/', '/__mocks__/', 'jest.*.ts'],
  moduleNameMapper: {
    '^@career-compass/shared$': '<rootDir>/../shared/src/index.ts',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
};

export default config;
