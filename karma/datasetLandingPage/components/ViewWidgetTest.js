import ViewWidget from 'components/ViewWidget';
import mockViewWidget from 'data/mockViewWidget';

describe('components/ViewWidget', function() {
  it('renders an element', function() {
    var element = renderComponent(ViewWidget, mockViewWidget);
    expect(element).to.exist;
  });
});
