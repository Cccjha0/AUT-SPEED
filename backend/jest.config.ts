import type { Config } from 'jest';

const config: Config = {
  rootDir: '.',
  testEnvironment: 'node',
  verbose: true,
  moduleFileExtensions: ['ts', 'js', 'json'],
  testMatch: ['**/*.spec.ts', '**/*.e2e-spec.ts'],
  transform: {
    '^.+\\.(t|j)s$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.spec.json'
      }
    ]
  },
  collectCoverageFrom: ['src/**/*.ts'],
  coverageDirectory: '../coverage',
  setupFilesAfterEnv: ['<rootDir>/test/setup-tests.ts'],
  roots: ['<rootDir>/src', '<rootDir>/test']
};

export default config;
