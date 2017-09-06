import { expect, assert } from 'chai';
import { FeedbackPanel } from 'components/FeedbackPanel';
import { ESCAPE } from 'common/dom_helpers/keycodes';
import { Simulate } from 'react-dom/test-utils';

import mockServerConfig from 'mockServerConfig';

describe('FeedbackPanel', () => {
  // this forces velocity animations to run with 0ms duration and 0ms delay
  $.Velocity.mock = true;

  const getFeedbackButton = (el) => el.querySelector('.feedback-panel-button');
  const getContent = (el) => el.querySelector('.feedback-panel-content');
  const getDismissButton = (el) => el.querySelector('.flannel-header-dismiss');

  const assertIsHidden = (element, done) => {
    // while velocity's animations aren't running, this defer is needed to accomodate the callback
    _.defer(() => {
      assert.equal(element.getAttribute('aria-hidden'), 'true');
      assert.equal(element.getAttribute('tabindex'), '-1');
      done();
    });
  };

  const assertIsVisible = (element, done) => {
    // while velocity's animations aren't running, this defer is needed to accomodate the callback
    _.defer(() => {
      assert.isNull(element.getAttribute('aria-hidden'));
      assert.isNull(element.getAttribute('tabindex'));
      done();
    });
  };

  it('renders nothing when a user is not logged in', () => {
    const config = mockServerConfig;
    const element = renderComponent(FeedbackPanel, config);

    assert.isNull(element);
  });

  describe('when a user is logged in', () => {
    let element;

    beforeEach(() => {
      const config = _.extend({}, mockServerConfig, { currentUser: {} })
      element = renderComponent(FeedbackPanel, config);
    });

    it('renders an element when a user is logged in', () => {
      assert.isNotNull(element);
    });

    describe('opening the panel', () => {
      beforeEach(() => {
        Simulate.click(getFeedbackButton(element));
      });

      it('opens the panel on click of feedback button', (done) => {
        assertIsVisible(getContent(element), done);
      });

      it('hides the feedback button', (done) => {
        assertIsHidden(getFeedbackButton(element), done);
      });
    });

    describe('closing the panel', () => {
      it('closes on click of dismiss button', (done) => {
        Simulate.click(getDismissButton(element));
        assertIsHidden(getContent(element), done);
      });

      it('closes on escape keydown', (done) => {
        Simulate.keyUp(element, { keyCode: ESCAPE });
        assertIsHidden(getContent(element), done);
      });

      it('displays the feedback button', (done) => {
        Simulate.click(getDismissButton(element));
        assertIsVisible(getFeedbackButton(element), done);
      });
    });
  });
});
