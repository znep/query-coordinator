import { assert } from 'chai';
import sinon from 'sinon';

import { PreviewBar } from 'components/PreviewBar';

describe('PreviewBar', () => {
  let onClickSpy;
  let element;

  beforeEach(() => {
    onClickSpy = sinon.spy();
    element = renderComponent(PreviewBar, { onClickExit: onClickSpy });
  });

  it('renders', () => {
    assert.ok(element);
  });

  describe('back button', () => {
    it('renders', () => {
      assert.ok(element.querySelector('.btn-back'));
    });

    it('invokes onClickExit on click', () => {
      TestUtils.Simulate.click(element.querySelector('.btn-back'));
      sinon.assert.called(onClickSpy);
    });
  });

  describe('exit button', () => {
    it('renders', () => {
      assert.ok(element.querySelector('.btn-exit'));
    });

    it('invokes onClickExit on click', () => {
      TestUtils.Simulate.click(element.querySelector('.btn-exit'));
      sinon.assert.called(onClickSpy);
    });
  });

  it('renders the preview title', () => {
    assert.equal(element.innerText, translations.open_performance.preview);
  });
});
