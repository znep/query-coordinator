import sinon from 'sinon';

// Our error reporting is chatty.
export const stubConsoleError = () => {
  before(() => {
    sinon.stub(console, 'error');
  });

  after(() => {
    console.error.restore();
  });
};


