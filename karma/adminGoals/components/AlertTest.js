import Alert from 'components/Alert';
import translations from 'mockTranslations';

var getDefaultStore = require('testStore').getDefaultStore;

describe('components/Alert', function() {
  beforeEach(function() {
    var state = {
      goalTableData: {
        translations: translations
      }
    };

    this.output = renderComponentWithStore(Alert, {}, getDefaultStore(state));
  });

  it('should have alert message', function() {
    expect(this.output.innerHTML).to.eq(translations.admin.quick_edit.default_alert_message);
  });

});
