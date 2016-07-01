import { Tour } from 'components/Tour';
import utils from 'socrata-utils';
import mockServerConfig from 'data/mockServerConfig';

describe('components/Tour', function() {
  afterEach(function() {
    utils.getCookie.restore();
  });

  function renderTour(enabled, cookieSet) {
    window.serverConfig = _.cloneDeep(mockServerConfig);

    window.serverConfig.featureFlags.enableDatasetLandingPageTour = enabled;
    sinon.stub(utils, 'getCookie').returns(cookieSet);

    var element = renderPureComponent(Tour({
      onClickDone: _.noop,
      onCloseTour: _.noop
    }));

    return element.querySelector('[data-tour-step]');
  }

  describe('when the cookie is not set', function() {
    it('should not display a tour if the feature flag is disabled', function() {
      expect(renderTour(false, false)).to.not.exist;
    });

    it('should display a tour if the feature flag is enabled', function() {
      expect(renderTour(true, false)).to.exist;
    });
  });

  describe('when the cookie is set', function() {
    it('should not display a tour if the feature flag is disabled', function() {
      expect(renderTour(false, true)).to.not.exist;
    });

    it('should not display a tour if the feature flag is enabled', function() {
      expect(renderTour(true, true)).to.not.exist;
    });
  });
});
