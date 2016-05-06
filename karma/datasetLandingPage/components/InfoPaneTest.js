import { InfoPane } from 'components/InfoPane';
import mockView from 'data/mockView';

describe('components/InfoPane', function() {
  it('renders an element', function() {
    var element = renderComponent(InfoPane, {
      view: mockView
    });

    expect(element).to.exist;
  });
});
