import { expect, assert } from 'chai';
import mockServerConfig from 'data/mockServerConfig';
import mockFeaturedItem from 'data/mockFeaturedItem';
import { FeaturedContent } from 'components/FeaturedContent';

describe('components/FeaturedContent', function() {
  function resetServerConfig() {
    window.serverConfig = _.cloneDeep(mockServerConfig);
  }

  beforeEach(resetServerConfig);
  afterEach(resetServerConfig);

  function getProps(props) {
    return _.defaultsDeep({}, props, {
      contentList: _.fill(Array(3), mockFeaturedItem)
    });
  }

  it('does not render anything if the contentList is empty and the user is not logged in', function() {
    serverConfig.currentUser = null;

    var element = renderComponent(FeaturedContent, {
      contentList: [null, null, null]
    });

    assert.isNull(element);
  });

  it('does not render anything if the contentList is empty and the user is not a publisher', function() {
    serverConfig.currentUser = {
      roleName: 'chief executive senior vice president of technical marketing operations engineer'
    };

    var element = renderComponent(FeaturedContent, {
      contentList: [null, null, null]
    });

    assert.isNull(element);
  });

  describe('manage prompt', function() {
    it('renders the manage prompt if the user is a publisher', function() {
      serverConfig.currentUser = { rights: [ 'edit_others_datasets' ] };
      var element = renderComponent(FeaturedContent, getProps());
      assert.ok(element.querySelector('.manage-prompt'));
    });

    it('does not render the manage prompt if the user is not logged in', function() {
      serverConfig.currentUser = null;
      var element = renderComponent(FeaturedContent, getProps());
      assert.isNull(element.querySelector('.manage-prompt'));
    });
  });

  describe('cards', function() {
    it('renders one card for each featured item', function() {
      var element = renderComponent(FeaturedContent, {
        contentList: [mockFeaturedItem, null, mockFeaturedItem]
      });

      expect(element.querySelectorAll('.view-card')).to.have.length(2);
    });
  });
});
