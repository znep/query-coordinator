import sinon from 'sinon';
import SocrataChangeIndicator from 'adminGoals/components/SocrataChangeIndicator';
import translations from 'mockTranslations';

describe('components/SocrataChangeIndicator', function() {
  it('should call onRevert callback on click', function() {
    const callback = sinon.spy();
    const props = {
      onRevert: callback
    };

    const element = renderComponent(SocrataChangeIndicator, props);
    TestUtils.Simulate.click(element.querySelector('button'));

    sinon.assert.calledOnce(callback);
  });
});

