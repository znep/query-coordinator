import { PrivateNotice } from 'components/PrivateNotice';
import mockView from 'data/mockView';

describe('components/PrivateNotice', function() {
  it('renders an element', function() {
    var element = renderComponent(PrivateNotice, {
      view: mockView
    });

    expect(element).to.exist;
  });
});
