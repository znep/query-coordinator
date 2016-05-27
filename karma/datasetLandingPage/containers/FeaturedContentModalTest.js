import FeaturedContentModal from 'containers/FeaturedContentModal';
import { getDefaultStore } from 'testStore';

describe('containers/FeaturedContentModal', function() {
  beforeEach(function() {
    var store = getDefaultStore();

    var renderer = TestUtils.createRenderer();
    renderer.render(<FeaturedContentModal store={store} />);
    this.state = store.getState();
    this.output = renderer.getRenderOutput();
  });

  it('sets list prop', function() {
    expect(this.output.props.list).to.deep.equal(this.state.featuredContent.list);
  });

  it('sets isEditingFeaturedItem prop', function() {
    expect(this.output.props.isEditingFeaturedItem).to.equal(this.state.featuredContent.isEditingFeaturedItem);
  });

  it('sets stagedItem prop', function() {
    expect(this.output.props.stagedItem).to.equal(this.state.featuredContent.stagedItem);
  });

  it('sets the onClickAddFeaturedItem prop', function() {
    expect(this.output.props.onClickAddFeaturedItem).to.be.a.function;
  });

  it('sets the onClickEditFeaturedItem prop', function() {
    expect(this.output.props.onClickEditFeaturedItem).to.be.a.function;
  });

  it('sets the onClickRemoveFeaturedItem prop', function() {
    expect(this.output.props.onClickRemoveFeaturedItem).to.be.a.function;
  });
});
