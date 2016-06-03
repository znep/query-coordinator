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

  describe('feature flag', function() {
    it('renders an element if feature flag is enabled', function() {
      serverConfig.featureFlags.defaultToDatasetLandingPage = true;
      var element = renderComponent(FeaturedContent, getProps());
      expect(element).to.exist;
    });

    it('does not render an element if feature flag is disabled', function() {
      serverConfig.featureFlags.defaultToDatasetLandingPage = false;
      var element = renderComponent(FeaturedContent, getProps());
      expect(element).to.not.exist;
    });
  });

  it('does not render anything if the contentList is empty and the user is not logged in', function() {
    serverConfig.currentUser = null;

    var element = renderComponent(FeaturedContent, {
      contentList: [null, null, null]
    });

    expect(element).to.not.exist;
  });

  it('does not render anything if the contentList is empty and the user is not a publisher', function() {
    serverConfig.currentUser = {
      roleName: 'chief executive senior vice president of technical marketing operations engineer'
    };

    var element = renderComponent(FeaturedContent, {
      contentList: [null, null, null]
    });

    expect(element).to.not.exist;
  });

  describe('manage prompt', function() {
    it('renders the manage prompt if the user is a publisher', function() {
      serverConfig.currentUser = { roleName: 'publisher' };
      var element = renderComponent(FeaturedContent, getProps());
      expect(element.querySelector('.manage-prompt')).to.exist;
    });

    it('does not render the manage prompt if the user is not logged in', function() {
      serverConfig.currentUser = null;
      var element = renderComponent(FeaturedContent, getProps());
      expect(element.querySelector('.manage-prompt')).to.not.exist;
    });
  });

  describe('widgets', function() {
    it('renders one widget for each featured item', function() {
      var element = renderComponent(FeaturedContent, {
        contentList: [mockFeaturedItem, null, mockFeaturedItem]
      });

      expect(element.querySelectorAll('.view-widget')).to.have.length(2);
    });
  });
});
