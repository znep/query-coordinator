import * as a11y from 'common/a11y';

describe('a11y', () => {
  let element;
  const actionableTags = ['input', 'select', 'textarea', 'a', 'button'];
  const getTagName = (element) => element.tagName.toLowerCase();

  afterEach(() => {
    if (element) {
      element.remove();
      element = null;
    }
  });

  describe('getAllActionableElements', () => {
    let actionableElements;

    beforeEach(() => {
      element = document.createElement('div');
      element.innerHTML = [
        '<p>hi</p>',
        '<input disabled>',
        '<span>click</span>',
        '<select></select>',
        '<textarea></textarea>',
        '<img>',
        '<a>here</a>',
        '<button disabled>please</button>'
      ].join('');
      actionableElements = a11y.getAllActionableElements(element);
    });

    it('returns every actionable element in the element', () => {
      assert.equal(actionableElements.length, 3);
    });

    it('returns actionable elements', () => {
      const hasActionableElements = _.every(actionableElements, (actionableElement) => (
        _.includes(actionableTags, getTagName(actionableElement))
      ));

      assert.equal(hasActionableElements, true);
    });

    it('does not return disabled elements', () => {
      const hasDisabledElements = _.some(actionableElements, (actionableElement) => (
        actionableElement.hasAttribute('disabled')
      ));

      assert.equal(hasDisabledElements, false);
    });
  });

  describe('getFirstActionableElement', () => {
    it('returns the first actionable element if no excluded selector is provided', () => {
      element = document.createElement('div');
      element.innerHTML = '<p>hi</p><button disabled>click</button><input><textarea></textarea>';
      const actionableElement = a11y.getFirstActionableElement(element);

      assert.equal(getTagName(actionableElement), 'input');
    });

    it('returns the first actionable element that does not match the excluded selector', () => {
      element = document.createElement('div');
      element.innerHTML = '<p>hi</p><button disabled>click</button><input><textarea></textarea>';
      const actionableElement = a11y.getFirstActionableElement(element, 'input');

      assert.equal(getTagName(actionableElement), 'textarea');
    });

    it('returns the excluded element if there are no other actionable elements', () => {
      element = document.createElement('div');
      element.innerHTML = '<a>Link</a>';
      const actionableElement = a11y.getFirstActionableElement(element, 'a');

      assert.equal(getTagName(actionableElement), 'a');
    });

    it('returns undefined if there are no actionable elements', () => {
      element = document.createElement('div');
      assert.equal(a11y.getFirstActionableElement(element), undefined);
    });
  });

  // We're attaching the element to the body in order to test focus
  describe('focusFirstActionableElement', () => {
    it('focuses the first actionable element if no excluded selector is provided', () => {
      element = document.createElement('div');
      element.innerHTML = '<p>hi</p><button disabled>click</button><input><textarea></textarea>';
      document.body.appendChild(element);
      a11y.focusFirstActionableElement(element);

      const tag = getTagName(document.activeElement);
      assert.equal(tag, 'input');
    });

    it('focuses on the first actionable element that does not match the excluded selector', () => {
      element = document.createElement('div');
      element.innerHTML = '<p>hi</p><button disabled>click</button><input><textarea></textarea>';
      document.body.appendChild(element);
      a11y.focusFirstActionableElement(element, 'input');
      const tag = getTagName(document.activeElement);

      assert.equal(tag, 'textarea');
    });

    it('focuses on the excluded element if there are no other actionable elements', () => {
      element = document.createElement('div');
      element.innerHTML = '<input>';
      document.body.appendChild(element);
      a11y.focusFirstActionableElement(element, 'input');
      const tag = getTagName(document.activeElement);

      assert.equal(tag, 'input');
    });

    it('does not focus on anything if there are no actionable elements', () => {
      element = document.createElement('div');
      document.body.appendChild(element);
      a11y.focusFirstActionableElement(element, 'input');

      assert.equal(document.activeElement, document.body);
    });
  });

  describe('getLastActionableElement', () => {
    it('returns the last actionable element', () => {
      element = document.createElement('div');
      element.innerHTML = '<p>hi</p><button disabled>click</button><a>me</a><input>';

      const tag = getTagName(a11y.getLastActionableElement(element));
      assert.equal(tag, 'input');
    });

    it('returns undefined if there are no actionable elements', () => {
      element = document.createElement('div');
      assert.equal(a11y.getLastActionableElement(element), undefined);
    });
  });

  describe('makeElementAndChildrenAccessible', () => {
    beforeEach(() => {
      element = document.createElement('div');
      element.innerHTML = '<button tabindex="-1">click</button><a tabindex="2">me</a>';
      a11y.makeElementAndChildrenAccessible(element);
    });

    it('removes any tabindex attributes from any actionable elements', () => {
      const actionableElements = element.querySelectorAll(actionableTags.join(', '));
      const hasNoTabIndex = _.every(actionableElements, (actionableElement) => (
        !actionableElement.hasAttribute('tabindex')
      ));

      assert.equal(hasNoTabIndex, true);
    });

    it('removes an aria-hidden attribute from the element', () => {
      assert.equal(element.getAttribute('aria-hidden'), undefined);
    });
  });

  describe('makeElementAndChildrenInaccessible', () => {
    beforeEach(() => {
      element = document.createElement('div');
      element.innerHTML = '<button>click</button><a>me</a>';
      a11y.makeElementAndChildrenInaccessible(element);
    });

    it('adds a tabindex of -1 to any actionable elements', () => {
      const actionableElements = element.querySelectorAll(actionableTags.join(', '));
      const hasNoTabIndex = _.every(actionableElements, (actionableElement) => (
        actionableElement.getAttribute('tabindex') === '-1'
      ));

      assert.equal(hasNoTabIndex, true);
    });

    it('adds an aria-hidden attribute to the element', () => {
      assert.equal(element.getAttribute('aria-hidden'), 'true');
    });
  });
});
