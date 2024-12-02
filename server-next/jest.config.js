/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: 'ts-jest',
    verbose: true,
    maxWorkers: 1,
  
    testEnvironment: 'node',
    roots: ['<rootDir>/src'],
    transform: {
      '^.+\\.tsx?$': 'ts-jest',
    },
    reporters: ['default'],
    testTimeout: 3600000, // 3600 seconds
  };
  