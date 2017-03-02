import { FeedbackPanel } from 'components/FeedbackPanel';

import mockServerConfig from 'mockServerConfig';

describe('FeedbackPanel', () => {
  it('renders nothing when a user is not logged in', () => {
    const config = mockServerConfig;

    const element = renderComponent(FeedbackPanel, config);

    assert.isNull(element);
  });

  it('renders an element when a user is logged in', () => {
    const config = _.extend({}, mockServerConfig, { currentUser: {} })

    const element = renderComponent(FeedbackPanel, config);

    assert.isNotNull(element);
  });
});
