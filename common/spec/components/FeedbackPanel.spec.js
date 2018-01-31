import _ from 'lodash';
import $ from 'jquery';
import { assert } from 'chai';
import { FeedbackPanel } from 'common/components';
import { ESCAPE } from 'common/dom_helpers/keycodes_deprecated';
import { Simulate } from 'react-dom/test-utils';
import { renderComponent } from '../helpers';

describe('FeedbackPanel', () => {
  // this forces velocity animations to run with 0ms duration and 0ms delay
  $.Velocity.mock = true;

  const defaultProps = {
    currentUser: null,
    locale: 'fake-locale',
    usersnapProjectID: 'abcd1234-acbd-1234-abcd-abcd1234abcd'
  };

  let usersnapMock;
  let zendeskMock;

  beforeEach(() => {
    usersnapMock = {
      init: sinon.stub()
    };
    zendeskMock = {
      init: sinon.stub()
    };

    FeedbackPanel.__Rewire__('usersnap', usersnapMock);
    FeedbackPanel.__Rewire__('zendesk', zendeskMock);
  });

  afterEach(() => {
    FeedbackPanel.__ResetDependency__('usersnap');
    FeedbackPanel.__ResetDependency__('zendesk');
  });

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
    const element = renderComponent(FeedbackPanel, defaultProps);

    assert.isNull(element);
  });

  describe('when a user is logged in', () => {
    let element;

    beforeEach(() => {
      const props = _.extend({}, defaultProps, { currentUser: { id: 'fake-user' } });
      element = renderComponent(FeedbackPanel, props);
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

      it('calls init on usersnap', () => {
        sinon.assert.calledOnce(usersnapMock.init);
        sinon.assert.calledWithMatch(usersnapMock.init,
          defaultProps.usersnapProjectID,
          {
            locale: 'fake-locale',
            user: { id: 'fake-user' }
          }
        );
      });

      it('calls init on zendesk', () => {
        sinon.assert.calledOnce(zendeskMock.init);
        sinon.assert.calledWithMatch(
          zendeskMock.init,
          {
            locale: 'fake-locale',
            user: { id: 'fake-user' }
          }
        );
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
