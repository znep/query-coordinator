import { assert } from 'chai';
import App from 'App';

import { ModeStates } from 'lib/constants';

import { getStore } from './testStore';

describe('App', () => {
  it('renders', () => {
    const element = renderComponentWithStore(App);
    assert.ok(element);
  });

  describe('edit mode', () => {
    let element;

    beforeEach(() => {
      const store = getStore({
        view: {
          mode: ModeStates.EDIT
        }
      });

      element = renderComponentWithStore(App, {}, store);
    });

    it('renders an edit bar', () => {
      assert.ok(element.querySelector('.edit-bar'));
    });

    it('does not render a preview bar', () => {
      assert.isNull(element.querySelector('.preview-bar'));
      assert.isNull(document.querySelector('.preview-mode'));
    });

    it('does not display site chrome', () => {
      assert.ok(document.querySelector('.hide-site-chrome'));
    });

    it('renders an InfoPane', () => {
      assert.ok(element.querySelector('.info-pane'));
    });

    // TODO: make assertions about contents rendered into each tab + sidebar
  });

  describe('preview mode', () => {
    let element;

    beforeEach(() => {
      const store = getStore({
        view: {
          mode: ModeStates.PREVIEW
        }
      });

      element = renderComponentWithStore(App, {}, store);
    });

    it('does not render an edit bar', () => {
      assert.isNull(element.querySelector('.edit-bar'));
    });

    it('renders a preview bar', () => {
      assert.ok(element.querySelector('.preview-bar'));
      assert.ok(document.querySelector('.preview-mode'));
    });

    it('displays site chrome', () => {
      assert.isNull(document.querySelector('.hide-site-chrome'));
    });

    it('renders an InfoPane', () => {
      assert.ok(element.querySelector('.info-pane'));
    });

    // TODO: make assertions about contents rendered into each tab + sidebar
  });

  describe('view mode', () => {
    let element;

    beforeEach(() => {
      const store = getStore({
        view: {
          mode: ModeStates.VIEW
        }
      });

      element = renderComponentWithStore(App, {}, store);
    });

    it('does not render an edit bar', () => {
      assert.isNull(element.querySelector('.edit-bar'));
    });

    it('does not render a preview bar', () => {
      assert.isNull(element.querySelector('.preview-bar'));
      assert.isNull(document.querySelector('.preview-mode'));
    });

    it('displays site chrome', () => {
      assert.isNull(document.querySelector('.hide-site-chrome'));
    });

    it('renders an InfoPane', () => {
      assert.ok(element.querySelector('.info-pane'));
    });

    // TODO: make assertions about contents rendered into each tab + sidebar
  });
});
