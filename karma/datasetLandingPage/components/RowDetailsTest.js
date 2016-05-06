import RowDetails from 'components/RowDetails';
import mockView from 'data/mockView';

describe('components/RowDetails', function() {
  it('renders an element', function() {
    var element = renderComponent(RowDetails, {
      view: mockView
    });

    expect(element).to.exist;
  });
});
