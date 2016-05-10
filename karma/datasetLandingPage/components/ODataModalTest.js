import { ODataModal } from 'components/ODataModal';
import mockView from 'data/mockView';

describe('components/ODataModal', function() {
  it('renders an element', function() {
    var element = renderComponent(ODataModal, {
      view: mockView
    });

    expect(element).to.exist;
  });
});
