import { expect, assert } from 'chai';
import SocrataAlert from 'adminGoals/components/SocrataAlert';
import translations from 'mockTranslations';

var getDefaultStore = require('testStore').getDefaultStore;

describe('components/SocrataAlert', function() {
  const ALERT_MESSAGE = 'My alert message!';
  const ALERT_TYPE = 'success';

  beforeEach(function() {
    this.output = renderComponentWithStore(SocrataAlert, { type: ALERT_TYPE, message: ALERT_MESSAGE });
  });

  it('should have alert message', function() {
    expect(this.output.innerHTML).to.eq(ALERT_MESSAGE);
  });

  it('should have alert type class', function () {
    expect(this.output.classList.contains(ALERT_TYPE)).to.eq(true);
  });
});
