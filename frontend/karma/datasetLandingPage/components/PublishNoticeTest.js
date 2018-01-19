import sinon from 'sinon';
import { expect, assert } from 'chai';
import { PublishNotice } from 'datasetLandingPage/components/PublishNotice';
import { Simulate } from 'react-dom/test-utils';
import mockView from '../data/mockView';

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
    window.serverConfig.currentUser = { rights: [ 'edit_others_datasets' ] };
  });

  afterEach(() => {
    window.serverConfig.currentUser = null;
  });

  it('renders an element', () => {
    var element = renderComponent(PublishNotice, getProps());
    assert.ok(element);
  });

  it('does not render if the dataset is not unpublished', () => {
    var element = renderComponent(PublishNotice, getProps({
      view: {
        isUnpublished: false
      }
    }));

    assert.isNull(element);
  });

  it('renders an error if the publish operation failed', () => {
    var element = renderComponent(PublishNotice, getProps({
      view: {
        hasPublishingError: true
      }
    }));

    assert.ok(element.querySelector('.alert.publish-notice'));
    assert.ok(element.querySelector('.alert.publish-error'));
  });

  it('renders a button by default', () => {
    var element = renderComponent(PublishNotice, getProps());
    var button = element.querySelector('button');
    assert.ok(button);
    expect(button.textContent).to.equal('Publish');
    assert.isNull(button.querySelector('.spinner-default'));
    expect(button.classList.contains('btn-success')).to.equal(false);
  });

  it('does not render a button if the user is unroled', () => {
    window.serverConfig.currentUser = null;
    const element = renderComponent(PublishNotice, getProps());
    assert.isNull(element.querySelector('button'));
  });

  it('renders a button with a spinner if the view is being published', () => {
    var element = renderComponent(PublishNotice, getProps({
      view: {
        isPublishing: true
      }
    }));

    var button = element.querySelector('button');
    assert.ok(button.querySelector('.spinner-default'));
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
    assert.ok(flyoutId);
    assert.ok(element.querySelector(`#${flyoutId}.flyout`));
  });
});
