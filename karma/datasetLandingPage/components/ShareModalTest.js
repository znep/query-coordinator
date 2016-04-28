import { ShareModal } from 'components/ShareModal';
import mockView from 'data/mockView';

describe('components/ShareModal', function() {
  it('renders an element', function() {
    var element = renderComponent(ShareModal, {
      view: mockView
    });

    expect(element).to.exist;
  });
});
