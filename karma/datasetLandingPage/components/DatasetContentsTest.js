import { DatasetContents } from 'components/DatasetContents';
import { getDefaultStore } from 'testStore';
import mockView from 'data/mockView';

describe('DatasetContents', function() {
  // we need to provide a store because this component has a nested smart component
  it('renders an element', function() {
    var store = getDefaultStore();

    var renderer = TestUtils.createRenderer();
    renderer.render(<DatasetContents store={store} view={mockView} />);
    var output = renderer.getRenderOutput();

    expect(output).to.exist;
  });
});
