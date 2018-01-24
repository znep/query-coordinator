import sinon from 'sinon';
import { expect, assert } from 'chai';
import { FeaturedContentViewCardManager } from 'catalogLandingPage/components/FeaturedContentViewCardManager';
import _ from 'lodash';

describe('components/FeaturedContentViewCardManager', () => {
  function getProps(props = {}) {
    return {
      openManager: _.noop,
      removeFeaturedContentItem: _.noop,
      contentType: 'internal',
      description: 'Dino Nuggets',
      displayType: 'Dataset',
      isPrivate: false,
      name: 'Dinosaurs',
      position: 0,
      resource_id: 0,
      uid: 'abcd-1234',
      url: '/d/test',
      viewCount: 100,
      ...props
    };
  }

  it('renders a FeaturedContentViewCard with an overlay', () => {
    const element = renderComponent(FeaturedContentViewCardManager, getProps());
    assert.isNotNull(element);
    assert.isNotNull(element.querySelector('.hover-target'));
    assert.isNotNull(element.querySelector('.overlay'));
  });

  it('removes the "hidden" class on mouseOver', () => {
    const element = renderComponent(FeaturedContentViewCardManager, getProps());
    assert.match(element.querySelector('.overlay').className, /hidden/);
    TestUtils.Simulate.mouseOver(element.querySelector('.hover-target'));
    assert.notMatch(element.querySelector('.overlay').className, /hidden/);
  });

  it('removes the "hidden" class on focus', () => {
    const element = renderComponent(FeaturedContentViewCardManager, getProps());
    assert.match(element.querySelector('.overlay').className, /hidden/);
    TestUtils.Simulate.focus(element.querySelector('.hover-target'));
    assert.notMatch(element.querySelector('.overlay').className, /hidden/);
  });

  it('adds the "hidden" class on mouseOut', () => {
    const element = renderComponent(FeaturedContentViewCardManager, getProps());
    TestUtils.Simulate.mouseOver(element.querySelector('.hover-target'));
    assert.notMatch(element.querySelector('.overlay').className, /hidden/);
    TestUtils.Simulate.mouseOut(element.querySelector('.hover-target'));
    assert.match(element.querySelector('.overlay').className, /hidden/);
  });

  it('calls the openManager prop on change button click', () => {
    var spy = sinon.spy();
    const element = renderComponent(FeaturedContentViewCardManager, getProps({
      openManager: spy
    }));
    TestUtils.Simulate.click(element.querySelector('.change-button'));
    sinon.assert.called(spy);
  });

  describe('remove button', () => {
    it('adds the "hidden" class on blur', () => {
      const element = renderComponent(FeaturedContentViewCardManager, getProps());
      TestUtils.Simulate.focus(element.querySelector('.hover-target'));
      assert.notMatch(element.querySelector('.overlay').className, /hidden/);
      TestUtils.Simulate.blur(element.querySelector('.remove-button'));
      assert.match(element.querySelector('.overlay').className, /hidden/);
    });

    it('calls the removeFeaturedContentItem prop on click', () => {
      var spy = sinon.spy();
      const element = renderComponent(FeaturedContentViewCardManager, getProps({
        removeFeaturedContentItem: spy
      }));
      TestUtils.Simulate.click(element.querySelector('.remove-button'));
      sinon.assert.called(spy);
    });
  });
});
