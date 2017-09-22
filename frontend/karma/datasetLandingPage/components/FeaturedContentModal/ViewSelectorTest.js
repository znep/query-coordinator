import sinon from 'sinon';
import { expect, assert } from 'chai';
import { ViewSelector } from 'components/FeaturedContentModal/ViewSelector';
import { Simulate } from 'react-dom/test-utils';
import mockRelatedView from 'data/mockRelatedView';

describe('components/FeaturedContentModal/ViewSelector', function() {
  function getProps(props) {
    return _.defaults({}, props, {
      hasSaveError: false,
      isSaved: false,
      isSaving: false,
      isSavingViewUid: '',
      renderNoViews: _.noop,
      onClickChoose: _.noop,
      viewList: _.fill(Array(3), mockRelatedView)
    });
  }

  it('renders', function() {
    var element = renderComponent(ViewSelector, getProps());
    assert.ok(element);
  });

  describe('viewList', function() {
    describe('when there are views', function() {
      it('renders one ViewCard per view', function () {
        var element = renderComponent(ViewSelector, getProps());
        expect(element.querySelectorAll('.view-card')).to.have.length(3);
      });

      it('renders a choose button for each view', function () {
        var element = renderComponent(ViewSelector, getProps());
        expect(element.querySelectorAll('.view-select')).to.have.length(3);
      });
    });

    describe('when there are no views', function() {
      it('renders no view cards', function () {
        var noViewsProps = {
          viewList: []
        };
        var element = renderComponent(ViewSelector, getProps(noViewsProps));
        assert.isNull(element.querySelector('.view-card'));
      });

      it('calls renderNoViews if function is passed in', function() {
        var spy = sinon.spy();
        var element = renderComponent(ViewSelector, getProps({
          viewList: [],
          renderNoViews: spy
        }));
        expect(spy.callCount).to.equal(1);
      });
    });
  });

  describe('chooseButton', function() {
    it('renders a without saving or busy classes by default', function() {
      var element = renderComponent(ViewSelector, getProps());
      assert.isNull(element.querySelector('.view-select.btn-busy'));
      assert.isNull(element.querySelector('.view-select.btn-success'));
    });

    it('fires the onClickChoose when clicked', function() {
      var spy = sinon.spy();
      var element = renderComponent(ViewSelector, getProps({
        onClickChoose: spy
      }));
      expect(spy.callCount).to.equal(0);
      Simulate.click(element.querySelector('.view-select'));
      expect(spy.callCount).to.equal(1);
    });

    describe('if it is passed an isSavingViewUid', function() {
      it('gets the btn-busy class for the pressed view', function() {
        var element = renderComponent(ViewSelector, getProps({
          isSaving: true,
          isSavingViewUid: 'four-four'
        }));
        assert.ok(element.querySelector('.view-select.btn-busy'));
        assert.isNull(element.querySelector('.view-select.btn-success'));
      });

      it('gets a btn-success class when is has saves', function() {
        var element = renderComponent(ViewSelector, getProps({
          isSaved: true,
          isSavingViewUid: 'four-four'
        }));
        assert.ok(element.querySelector('.view-select.btn-success'));
        assert.isNull(element.querySelector('.view-select.btn-busy'));
      });

      it('does not add the state classes for other views', function() {
        var element = renderComponent(ViewSelector, getProps({
          isSaved: true,
          isSaving: true,
          isSavingViewUid: 'notr-ight'
        }));
        assert.isNull(element.querySelector('.view-select.btn-busy'));
        assert.isNull(element.querySelector('.view-select.btn-success'));
      });
    });
  });
});
