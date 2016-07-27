import { RowDetails } from 'components/RowDetails';
import mockView from 'data/mockView';

describe('components/RowDetails', function() {
  it('renders an element', function() {
    var element = renderPureComponent(RowDetails({
      view: mockView
    }));

    expect(element).to.exist;
  });

  describe('row label', function() {
    var view;

    beforeEach(function() {
      view = mockView;
    });

    it('renders for a non-default value', function() {
      view.rowLabel = 'thingamabob';
      var element = renderPureComponent(RowDetails({
        view: view
      }));

      expect(element.querySelectorAll('.metadata-pair')).to.have.length(3);
    });

    it('does not render for a default value', function() {
      view.rowLabel = 'Row';
      var element = renderPureComponent(RowDetails({
        view: view
      }));

      expect(element.querySelectorAll('.metadata-pair')).to.have.length(2);
    });
  });
});
