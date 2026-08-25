module.exports = {
  roots: ['<rootDir>/tests'],
  testEnvironment: 'node',
  collectCoverageFrom: [
    'services/**/src/**/*.js',
    'frontend/src/**/*.{js,jsx}',
  ],
  coverageThreshold: {
    global: {
      lines: 80,
    },
  },
}