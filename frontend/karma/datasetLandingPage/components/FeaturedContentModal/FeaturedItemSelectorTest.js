import sinon from 'sinon';
import { expect, assert } from 'chai';
import { FeaturedItemSelector } from 'components/FeaturedContentModal/FeaturedItemSelector';
import { Simulate } from 'react-addons-test-utils';
import mockFeaturedItem from 'data/mockFeaturedItem';

describe('components/FeaturedContentModal/FeaturedItemSelector', function() {
  function getProps(props) {
    return _.defaults({}, props, {
      contentList: _.fill(Array(3), mockFeaturedItem)
    });
  }

  it('renders something', function() {
    var element = renderComponent(FeaturedItemSelector, getProps());
    assert.ok(element);
  });

  describe('markup', function() {
    var element;

    beforeEach(function() {
      element = renderComponent(FeaturedItemSelector, getProps());
    });

    it('renders a header', function() {
      assert.ok(element.querySelector('.modal-content h2'));
    });

    it('renders an introduction', function() {
      assert.ok(element.querySelector('.modal-content p'));
    });

    it('renders the featured content', function() {
      assert.ok(element.querySelector('.modal-content .featured-content'));
    });

    it('renders a footer', function() {
      assert.ok(element.querySelector('footer'));
      assert.ok(element.querySelector('footer .done-button'));
    });
  });

  it('renders placeholders for featured items that do not exist', function() {
    var element = renderComponent(FeaturedItemSelector, getProps({
      contentList: [null, mockFeaturedItem, null]
    }));

    expect(element.querySelectorAll('.featured-item')).to.have.length(3);
    expect(element.querySelectorAll('.featured-item.placeholder')).to.have.length(2);
  });

  it('renders edit and remove buttons on items that exist', function() {
    var element = renderComponent(FeaturedItemSelector, getProps({
      contentList: [mockFeaturedItem, null, null]
    }));

    assert.ok(element.querySelector('.featured-item .edit-button'));
    assert.ok(element.querySelector('.featured-item .remove-button'));
  });

  it('renders the remove button with text if the item is not being removed', function() {
    var element = renderComponent(FeaturedItemSelector, getProps({
      contentList: [null, mockFeaturedItem, null]
    }));

    assert.isNull(element.querySelector('.featured-item .remove-button .spinner-default'));
  });

  it('renders the remove button with a spinner if an item is being removed', function() {
    var element = renderComponent(FeaturedItemSelector, getProps({
      contentList: [null, mockFeaturedItem, null],
      removePosition: 1,
      isRemoving: true
    }));

    assert.ok(element.querySelector('.featured-item .remove-button .spinner-default'));
  });

  it('renders an add button on placeholders', function() {
    var element = renderComponent(FeaturedItemSelector, getProps({
      contentList: [null, null, null]
    }));

    var button = element.querySelector('.featured-item:first-child .btn');
    expect(button.textContent).to.equal('Add...');
  });

  it('renders more buttons when you click the add button on placeholders', function() {
    var element = renderComponent(FeaturedItemSelector, getProps({
      contentList: [null, null, null]
    }));

    expect(element.querySelectorAll('.featured-item:first-child .btn')).to.have.length(1);

    var button = element.querySelector('.featured-item:first-child .btn');
    Simulate.click(button);

    expect(element.querySelectorAll('.featured-item:first-child .btn')).to.have.length(3);
  });

  it('does not render a story button on placeholder when Perspectives is not enabled', function() {
    window.serverConfig.featureFlags.stories_enabled = false;
    var element = renderComponent(FeaturedItemSelector, getProps({
      contentList: [null, null, null]
    }));

    expect(element.querySelectorAll('.featured-item:first-child .btn')).to.have.length(1);

    var button = element.querySelector('.featured-item:first-child .btn');
    Simulate.click(button);

    var buttons = element.querySelectorAll('.featured-item:first-child .btn');
    var hasStoryOption = _.some(buttons, function(button) {
      return button.innerText === I18n.featured_content_modal.story
    });

    expect(buttons).to.have.length(2);
    assert.isFalse(hasStoryOption);
  });

  describe('actions', function() {
    it('calls onClickDone when the done button is clicked', function() {
      var spy = sinon.spy();

      var element = renderComponent(FeaturedItemSelector, getProps({
        onClickDone: spy
      }));

      expect(spy.callCount).to.equal(0);
      Simulate.click(element.querySelector('.done-button'));
      expect(spy.callCount).to.equal(1);
    });

    it('calls onClickAdd when the add button is clicked', function() {
      var spy = sinon.spy();

      var element = renderComponent(FeaturedItemSelector, getProps({
        onClickAdd: spy,
        contentList: [null, null, null]
      }));

      Simulate.click(element.querySelector('.featured-item:first-child .btn'));
      expect(spy.callCount).to.equal(0);
      Simulate.click(element.querySelector('.featured-item:first-child .btn-wide'));
      expect(spy.callCount).to.equal(1);
    });

    it('calls onClickEdit when the edit button is clicked', function() {
      var spy = sinon.spy();

      var element = renderComponent(FeaturedItemSelector, getProps({
        onClickEdit: spy
      }));

      expect(spy.callCount).to.equal(0);
      Simulate.click(element.querySelector('.featured-item:first-child .edit-button'));
      expect(spy.callCount).to.equal(1);
    });

    it('calls onClickRemove when the remove button is clicked', function() {
      var spy = sinon.spy();

      var element = renderComponent(FeaturedItemSelector, getProps({
        onClickRemove: spy
      }));

      expect(spy.callCount).to.equal(0);
      Simulate.click(element.querySelector('.featured-item:first-child .remove-button'));
      expect(spy.callCount).to.equal(1);
    });

    it('does not call onClickRemove when the remove button is clicked and the item is already being removed', function() {
      var spy = sinon.spy();

      var element = renderComponent(FeaturedItemSelector, getProps({
        onClickRemove: spy,
        isRemoving: true,
        removePosition: 0
      }));

      expect(spy.callCount).to.equal(0);
      Simulate.click(element.querySelector('.featured-item:first-child .remove-button'));
      expect(spy.callCount).to.equal(0);
    });
  });
});
