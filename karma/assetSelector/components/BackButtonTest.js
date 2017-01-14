import { BackButton } from 'components/BackButton';

describe('components/BackButton', function() {
  it('renders', function() {
    var element = renderComponentWithStore(BackButton);
    expect(element).to.exist;
    expect(element.className).to.eq('back-button');
  });

  it('dispatches the close-modal action on click', function() {
    var spy = sinon.spy();
    var element = renderComponentWithStore(BackButton, { dispatchCloseModal: spy });
    TestUtils.Simulate.click(element.querySelector('.close-modal'));
    expect(spy).to.have.been.called;
  });
});
