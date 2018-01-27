import { assert } from 'chai';
import { shallow } from 'enzyme';

import { App } from 'opMeasure/App';
import EditBar from 'opMeasure/components/EditBar';
import PreviewBar from 'opMeasure/components/PreviewBar';
import InfoPane from 'opMeasure/components/InfoPane';
import { ModeStates } from 'common/performance_measures/lib/constants';

describe('App', () => {
  describe('edit mode', () => {
    let element;

    beforeEach(() => {
      element = shallow(<App mode={ModeStates.EDIT} activePane="summary" isEditing={false} />);
    });

    it('renders an edit bar', () => {
      assert.lengthOf(element.find(EditBar), 1);
    });

    it('does not render a preview bar', () => {
      element.instance().componentDidMount();
      assert.isFalse(element.find(PreviewBar).exists());
      assert.isNull(document.querySelector('.preview-mode'));
    });

    it('does not display site chrome', () => {
      element.instance().componentDidMount();
      assert.ok(document.querySelector('.hide-site-chrome'));
    });

    it('renders an InfoPane', () => {
      assert.lengthOf(element.find(InfoPane), 1);
    });

    // TODO: make assertions about contents rendered into each tab + sidebar
  });

  describe('preview mode', () => {
    let element;

    beforeEach(() => {
      element = shallow(<App mode={ModeStates.PREVIEW} activePane="summary" isEditing={false} />);
    });

    it('does not render an edit bar', () => {
      assert.isFalse(element.find(EditBar).exists());
    });

    it('renders a preview bar', () => {
      element.instance().componentDidMount();
      assert.lengthOf(element.find(PreviewBar), 1);
      assert.ok(document.querySelector('.preview-mode'));
    });

    it('displays site chrome', () => {
      element.instance().componentDidMount();
      assert.isNull(document.querySelector('.hide-site-chrome'));
    });

    it('renders an InfoPane', () => {
      assert.lengthOf(element.find(InfoPane), 1);
    });

    // TODO: make assertions about contents rendered into each tab + sidebar
  });

  describe('view mode', () => {
    let element;

    beforeEach(() => {
      element = shallow(<App mode={ModeStates.VIEW} activePane="summary" isEditing={false} />);
    });

    it('does not render an edit bar', () => {
      assert.isFalse(element.find(EditBar).exists());
    });

    it('does not render a preview bar', () => {
      element.instance().componentDidMount();
      assert.isFalse(element.find(PreviewBar).exists());
      assert.isNull(document.querySelector('.preview-mode'));
    });

    it('displays site chrome', () => {
      element.instance().componentDidMount();
      assert.isNull(document.querySelector('.hide-site-chrome'));
    });

    it('renders an InfoPane', () => {
      assert.lengthOf(element.find(InfoPane), 1);
    });

    // TODO: make assertions about contents rendered into each tab + sidebar
  });
});
