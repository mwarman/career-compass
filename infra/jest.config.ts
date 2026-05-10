import type { Config } from 'jest';

const config: Config = {
  displayName: 'shared',
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['**/__tests__/**/*.ts', '**/*.test.ts', '**/*.spec.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/cdk.out/'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  modulePathIgnorePatterns: ['/node_modules/', '/dist/', '/cdk.out/'],
  collectCoverageFrom: ['**/*.ts', '!**/*.d.ts', '!**/node_modules/**', '!**/dist/**', '!**/cdk.out/**'],
  coveragePathIgnorePatterns: ['/node_modules/', '/dist/', 'jest.*.ts'],
};

export default config;
