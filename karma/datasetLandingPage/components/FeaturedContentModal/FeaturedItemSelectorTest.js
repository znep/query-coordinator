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
    expect(element).to.exist;
  });

  describe('markup', function() {
    var element;

    beforeEach(function() {
      element = renderComponent(FeaturedItemSelector, getProps());
    });

    it('renders a header', function() {
      expect(element.querySelector('.modal-content > h2')).to.exist;
    });

    it('renders an introduction', function() {
      expect(element.querySelector('.modal-content > p')).to.exist;
    });

    it('renders the featured content', function() {
      expect(element.querySelector('.modal-content > .featured-content')).to.exist;
    });

    it('renders a footer', function() {
      expect(element.querySelector('footer')).to.exist;
      expect(element.querySelector('footer .done-button')).to.exist;
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

    expect(element.querySelector('.featured-item .edit-button')).to.exist;
    expect(element.querySelector('.featured-item .remove-button')).to.exist;
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

    it('calls onClickRemove when the edit button is clicked', function() {
      var spy = sinon.spy();

      var element = renderComponent(FeaturedItemSelector, getProps({
        onClickRemove: spy
      }));

      expect(spy.callCount).to.equal(0);
      Simulate.click(element.querySelector('.featured-item:first-child .remove-button'));
      expect(spy.callCount).to.equal(1);
    });
  });
});
