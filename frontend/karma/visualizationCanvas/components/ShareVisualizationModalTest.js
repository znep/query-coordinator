import { assert } from 'chai';
import sinon from 'sinon';
import { ShareVisualizationModal } from 'visualizationCanvas/components/ShareVisualizationModal';
import mockVif from 'data/mockVif';

describe('ShareVisualizationModal', () => {
  beforeEach(() => {
    sinon.stub($.fn, 'socrataSvgHistogram');
  });

  afterEach(() => {
    $.fn.socrataSvgHistogram.restore();
  });

  const getProps = (props) => {
    return {
      vifIndex: 0,
      vif: mockVif,
      isActive: true,
      copyableLinkUrl: 'a link',
      embedCode: 'some script',
      embedSize: 'medium',
      onDismiss: () => {},
      onChooseEmbedSize: () => {},
      ...props
    };
  };

  describe('when isActive is false', () => {
    let element;

    beforeEach(() => {
      element = renderComponent(ShareVisualizationModal, getProps({
        isActive: false
      }));
    });

    it('does not render when isActive is false', () => {
      assert.isNull(element);
    });
  });

  describe('when isActive is true', () => {
    let $element;
    beforeEach(() => {
      $element = $(renderComponent(ShareVisualizationModal, getProps()));
    });

    it('renders', () => {
      assert.lengthOf($element, 1);
    });

    it('renders the script', function() {
      assert.equal($element.find('#share-embed-code-field').text(), 'some script')
    });

    describe('copyableLinkUrl is set', () => {
      it('renders the link', function() {
        assert.equal($element.find('#share-link-field').val(), 'a link');
      });

      it('does not render an info message', function() {
        assert.lengthOf($element.find('.alert.info'), 0);
      });
    });

    describe('copyableLinkUrl not set', () => {
      beforeEach(() => {
        $element = $(renderComponent(ShareVisualizationModal, getProps({
          copyableLinkUrl: null
        })));
      });

      it('does not render the link', function() {
        assert.lengthOf($element.find('#share-link-field'), 0);
      });

      it('renders an info message', function() {
        assert.lengthOf($element.find('.alert.info'), 1);
      });
    });

    it('chooses the given size', function() {
      assert.match($element.find('.dropdown-placeholder').text(), /Medium\s\(400x300\)/);
    });
  });
});
