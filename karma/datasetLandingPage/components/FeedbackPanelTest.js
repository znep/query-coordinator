import { FeedbackPanel } from 'components/FeedbackPanel';
import mockView from 'data/mockView';
import mockServerConfig from 'data/mockServerConfig';

describe('components/FeedbackPanel', function() {
  function resetServerConfig() {
    window.serverConfig = _.cloneDeep(mockServerConfig);
  }

  beforeEach(resetServerConfig);
  afterEach(resetServerConfig);

  it('renders nothing when a user is not logged in', function() {
    serverConfig.currentUser = null;

    var element = renderComponent(FeedbackPanel, {
      view: mockView
    });

    expect(element).to.not.exist;
  });

  it('renders an element when a user is logged in', function() {
    serverConfig.currentUser = {};

    var element = renderComponent(FeedbackPanel, {
      view: mockView
    });

    expect(element).to.exist;
  });
});
