import { DatasetContents } from 'components/DatasetContents';
import mockView from 'data/mockView';

describe('DatasetContents', function() {
  it('renders an element', function() {
    var element = renderComponent(DatasetContents, {
      view: mockView
    });

    expect(element).to.exist;
  });
});
