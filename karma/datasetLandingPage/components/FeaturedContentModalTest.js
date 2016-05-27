import FeaturedContentModal from 'components/FeaturedContentModal';
import mockViewWidget from 'data/mockViewWidget';

describe('components/FeaturedContentModal', function() {
  var defaultProps = {
    isEditingFeaturedContent: true,
    list: [null, null, null],
    onClickAddFeaturedItem: _.noop,
    onClickEditFeaturedItem: _.noop,
    onClickRemoveFeaturedItem: _.noop
  };

  it('renders an element', function() {
    var element = renderComponent(FeaturedContentModal, defaultProps);
    expect(element).to.exist;
  });

  it('renders three featured items', function() {
    var element = renderComponent(FeaturedContentModal, defaultProps);
    expect(element.querySelectorAll('.featured-item')).to.have.length(3);
  });

  it('renders placeholders for featured items that are null', function() {
    var element = renderComponent(FeaturedContentModal, _.assign({}, defaultProps, {
      list: [null, { featuredView: mockViewWidget }, null]
    }));

    expect(element.querySelectorAll('.featured-item.placeholder')).to.have.length(2);
  });
});
