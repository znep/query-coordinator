import { ShareModal } from 'components/ShareModal';
import mockView from 'data/mockView';

describe('components/ShareModal', function() {
  it('renders an element', function() {
    var element = renderPureComponent(ShareModal({
      onClickOption: _.noop,
      view: mockView
    }));

    expect(element).to.exist;
  });
});
