import SCChangeIndicator from 'components/SCChangeIndicator';
import translations from 'mockTranslations';

describe('components/SCChangeIndicator', function() {
  it('should call onRevert callback on click', function() {
    const callback = sinon.spy();
    const props = {
      onRevert: callback
    };

    const element = renderPureComponent(SCChangeIndicator(props));
    TestUtils.Simulate.click(element.querySelector('button'));

    callback.should.have.been.calledOnce;
  });
});

