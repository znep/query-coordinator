import FeaturedContent from 'containers/FeaturedContent';
import { getDefaultStore } from 'testStore';

describe('containers/FeaturedContent', function() {
  beforeEach(function() {
    var store = getDefaultStore();

    var renderer = TestUtils.createRenderer();
    renderer.render(<FeaturedContent store={store} />);
    this.state = store.getState();
    this.output = renderer.getRenderOutput();
  });

  it('sets contentList prop', function() {
    expect(this.output.props.contentList).to.deep.equal(this.state.featuredContent.contentList);
  });

  it('sets isEditingFeaturedItem prop', function() {
    expect(this.output.props.isEditingFeaturedItem).to.equal(this.state.featuredContent.isEditingFeaturedItem);
  });

  it('sets stagedItem prop', function() {
    expect(this.output.props.stagedItem).to.equal(this.state.featuredContent.stagedItem);
  });
});
