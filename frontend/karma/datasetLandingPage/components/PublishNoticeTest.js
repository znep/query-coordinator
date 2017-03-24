import { PublishNotice } from 'components/PublishNotice';
import { Simulate } from 'react-addons-test-utils';
import mockView from 'data/mockView';

describe('components/PublishNotice', () => {
  function getProps(props) {
    return _.defaultsDeep({}, props, {
      view: _.merge(mockView, {
        isUnpublished: true,
        canPublish: true
      }),
      onClickPublish: _.noop
    });
  }

  beforeEach(() => {
    window.serverConfig.currentUser = { roleName: 'publisher' };
  });

  afterEach(() => {
    window.serverConfig.currentUser = null;
  });

  it('renders an element', () => {
    var element = renderComponent(PublishNotice, getProps());
    expect(element).to.exist;
  });

  it('does not render if the dataset is not unpublished', () => {
    var element = renderComponent(PublishNotice, getProps({
      view: {
        isUnpublished: false
      }
    }));

    expect(element).to.not.exist;
  });

  it('renders an error if the publish operation failed', () => {
    var element = renderComponent(PublishNotice, getProps({
      view: {
        hasPublishingError: true
      }
    }));

    expect(element.querySelector('.alert.publish-notice')).to.exist;
    expect(element.querySelector('.alert.publish-error')).to.exist;
  });

  it('renders a button by default', () => {
    var element = renderComponent(PublishNotice, getProps());
    var button = element.querySelector('button');
    expect(button).to.exist;
    expect(button.textContent).to.equal('Publish');
    expect(button.querySelector('.spinner-default')).to.not.exist;
    expect(button.classList.contains('btn-success')).to.equal(false);
  });

  it('does not render a button if the user is unroled', () => {
    window.serverConfig.currentUser = null;
    const element = renderComponent(PublishNotice, getProps());
    expect(element.querySelector('button')).to.not.exist;
  });

  it('renders a button with a spinner if the view is being published', () => {
    var element = renderComponent(PublishNotice, getProps({
      view: {
        isPublishing: true
      }
    }));

    var button = element.querySelector('button');
    expect(button.querySelector('.spinner-default')).to.exist;
  });

  it('renders a success button if the publishing succeeded', () => {
    var element = renderComponent(PublishNotice, getProps({
      view: {
        hasPublishingSuccess: true
      }
    }));

    var button = element.querySelector('button');
    expect(button.classList.contains('btn-success')).to.equal(true);
  });

  it('calls the onClickPublish prop when the publish button is clicked', () => {
    var spy = sinon.spy();
    var element = renderComponent(PublishNotice, getProps({
      onClickPublish: spy
    }));

    expect(spy.callCount).to.equal(0);
    Simulate.click(element.querySelector('button'));
    expect(spy.callCount).to.equal(1);
  });

  it('does not call the onClickPublish prop when the publish button is clicked if the view is publishing', () => {
    var spy = sinon.spy();
    var element = renderComponent(PublishNotice, getProps({
      view: {
        isPublishing: true
      },
      onClickPublish: spy
    }));

    expect(spy.callCount).to.equal(0);
    Simulate.click(element.querySelector('button'));
    expect(spy.callCount).to.equal(0);
  });

  it('calls the onDismissError prop when the dismiss icon is clicked', () => {
    var spy = sinon.spy();
    var element = renderComponent(PublishNotice, getProps({
      onDismissError: spy,
      view: {
        hasPublishingError: true
      }
    }));

    expect(spy.callCount).to.equal(0);
    Simulate.click(element.querySelector('.alert-dismiss'));
    expect(spy.callCount).to.equal(1);
  });

  it('disables the button and includes a flyout if the dataset is not able to be published', () => {
    var spy = sinon.spy();
    var element = renderComponent(PublishNotice, getProps({
      onClickPublish: spy,
      view: {
        canPublish: false
      }
    }));

    expect(spy.callCount).to.equal(0);
    Simulate.click(element.querySelector('button'));
    expect(spy.callCount).to.equal(0);

    var flyoutId = element.querySelector('button[data-flyout]').dataset.flyout;
    expect(flyoutId).to.exist;
    expect(element.querySelector(`#${flyoutId}.flyout`)).to.exist;
  });
});
