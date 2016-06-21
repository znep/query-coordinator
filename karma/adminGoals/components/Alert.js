import Alert from 'components/Alert';

var getDefaultStore = require('testStore').getDefaultStore;

describe('components/GoalTableHead', function() {
  beforeEach(function() {
    var state = {
      goalTableData: {
        alert: {
          label: 'error',
          message: 'text'
        }
      }
    };

    this.output = renderComponentWithStore(Alert, {}, getDefaultStore(state));
  });

  it('should have alert message', function() {
    expect(this.output.innerHTML).to.eq('text');
  });

  it('should have correct alert class', function() {
    expect(this.output.className).to.contain('error');
  });

});
