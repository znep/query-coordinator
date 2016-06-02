import Navbar from 'components/Navbar';
import mockView from 'data/mockView';

describe('components/Navbar', function() {
  it('renders an element', function() {
    var element = renderPureComponent(Navbar());
    expect(element).to.exist;
  });
});
