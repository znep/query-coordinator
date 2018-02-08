import sinon from 'sinon';

// After each test, assert that console.error() was called a particular number of times.
// Error output is suppressed in the test console.
export const expectConsoleErrorCallCount = (expectedCount) => {
  before(() => {
    sinon.stub(console, 'error');
  });

  afterEach(() => {
    sinon.assert.callCount(console.error, expectedCount);
    console.error.reset();
  });

  after(() => {
    console.error.restore();
  });
};
