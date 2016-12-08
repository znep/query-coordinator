import { PreviewBar } from 'components/PreviewBar';

describe('PreviewBar', () => {
  let onClickSpy;
  let element;

  beforeEach(() => {
    onClickSpy = sinon.spy();
    element = renderPureComponent(PreviewBar({ onClickExit: onClickSpy }));
  });

  it('renders', () => {
    expect(element).to.exist;
  });

  describe('back button', () => {
    it('renders', () => {
      expect(element.querySelector('.btn-back')).to.exist;
    });

    it('invokes onClickExit on click', () => {
      TestUtils.Simulate.click(element.querySelector('.btn-back'));
      expect(onClickSpy).to.have.been.called;
    });
  });

  describe('exit button', () => {
    it('renders', () => {
      expect(element.querySelector('.btn-exit')).to.exist;
    });

    it('invokes onClickExit on click', () => {
      TestUtils.Simulate.click(element.querySelector('.btn-exit'));
      expect(onClickSpy).to.have.been.called;
    });
  });

  it('renders the preview title', () => {
    expect(element.innerText).to.eq(I18n.preview);
  });
});
