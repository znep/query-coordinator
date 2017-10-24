import { expect, assert } from 'chai';
import { ShareModal } from 'components/ShareModal';
import mockView from 'data/mockView';

describe('components/ShareModal', function() {
  it('renders an element', function() {
    var element = renderComponent(ShareModal, {
      onClickOption: _.noop,
      view: mockView
    });

    assert.ok(element);
  });
});
