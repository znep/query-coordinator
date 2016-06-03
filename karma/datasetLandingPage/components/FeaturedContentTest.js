import mockServerConfig from 'data/mockServerConfig';
import FeaturedContent from 'components/FeaturedContent';

describe('components/FeaturedContent', function() {
  function resetServerConfig() {
    window.serverConfig = _.cloneDeep(mockServerConfig);
  }

  beforeEach(resetServerConfig);
  afterEach(resetServerConfig);

  var defaultProps = {
    contentList: [{}, {}, {}]
  };

  describe('feature flag', function() {
    it('renders an element if feature flag is enabled', function() {
      serverConfig.featureFlags.defaultToDatasetLandingPage = true;
      var element = renderComponent(FeaturedContent, defaultProps);
      expect(element).to.exist;
    });

    it('does not render an element if feature flag is disabled', function() {
      serverConfig.featureFlags.defaultToDatasetLandingPage = false;
      var element = renderComponent(FeaturedContent, defaultProps);
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

  describe('manage prompt', function() {
    it('renders the manage prompt if the user is logged in', function() {
      serverConfig.currentUser = {};
      var element = renderComponent(FeaturedContent, defaultProps);
      expect(element.querySelector('.manage-prompt')).to.exist;
    });

    it('does not render the manage prompt if the user is not logged in', function() {
      serverConfig.currentUser = null;
      var element = renderComponent(FeaturedContent, defaultProps);
      expect(element.querySelector('.manage-prompt')).to.not.exist;
    });
  });
});
