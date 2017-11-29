import * as handler from 'common/components/MultiSelect/MultiSelectKeyDownHandler';
import { assert } from 'chai';
import sinon from 'sinon';

describe('MultiSelectKeyDownHandler', () => {
  let onAddSelectedOptionSpy;
  let onOptionsVisibilityChangedSpy;
  let onRemoveSelectedOptionSpy;
  let onSelectedOptionIndexChangeSpy;
  let setUsingMouseSpy;
  let propsWithSpies;

  let preventDefaultSpy;
  let fakeEvent;

  beforeEach(() => {
    onAddSelectedOptionSpy = sinon.spy();
    onOptionsVisibilityChangedSpy = sinon.spy();
    onRemoveSelectedOptionSpy = sinon.spy();
    onSelectedOptionIndexChangeSpy = sinon.spy();
    setUsingMouseSpy = sinon.spy();

    propsWithSpies = {
      onSelectedOptionIndexChange: onSelectedOptionIndexChangeSpy,
      onOptionsVisibilityChanged: onOptionsVisibilityChangedSpy,
      setUsingMouse: setUsingMouseSpy,
      onAddSelectedOption: onAddSelectedOptionSpy,
      onRemoveSelectedOption: onRemoveSelectedOptionSpy
    };

    preventDefaultSpy = sinon.spy();
    fakeEvent = {
      preventDefault: preventDefaultSpy
    };
  });

  describe('hasSelectedItem', () => {
    it('returns true when given an integer', () => {
      assert.isTrue(handler.hasSelectedItem({ selectedOptionIndex: 3 }));
    });

    it('returns false when given null/undefined', () => {
      assert.isFalse(handler.hasSelectedItem({ selectedOptionIndex: null }));
      assert.isFalse(handler.hasSelectedItem({ selectedOptionIndex: undefined }));
      assert.isFalse(handler.hasSelectedItem({}));
    });

    it('returns false when not given an integer', () => {
      assert.isFalse(handler.hasSelectedItem({ selectedOptionIndex: 3.14 }));
    });
  });

  describe('handleArrowDown', () => {
    it('calls onSelectedOptionIndex change when options are visible and not at the end', () => {
      const options = [1, 2, 3];
      const selectedOptionIndex = 1;
      const props = {
        ...propsWithSpies,
        optionsVisible: true,
        selectedOptionIndex,
        options
      };

      handler.handleArrowDown(fakeEvent, props);

      assert.isTrue(onSelectedOptionIndexChangeSpy.calledOnce);
      assert.isTrue(onSelectedOptionIndexChangeSpy.calledWith(selectedOptionIndex + 1));

      assert.isTrue(setUsingMouseSpy.calledOnce);
      assert.isTrue(setUsingMouseSpy.calledWith(false));

      assert.isTrue(preventDefaultSpy.calledOnce);
    });

    it('calls onSelectedOptionIndex with 0 when options are visible but no option is selected', () => {
      const options = [1, 2, 3];
      const selectedOptionIndex = null;
      const props = {
        ...propsWithSpies,
        optionsVisible: true,
        selectedOptionIndex,
        options
      };

      handler.handleArrowDown(fakeEvent, props);

      assert.isTrue(onSelectedOptionIndexChangeSpy.calledOnce);
      assert.isTrue(onSelectedOptionIndexChangeSpy.calledWith(0));

      assert.isTrue(setUsingMouseSpy.calledOnce);
      assert.isTrue(setUsingMouseSpy.calledWith(false));

      assert.isTrue(preventDefaultSpy.calledOnce);
    });

    it('does not scroll past the last result', () => {
      const options = [1, 2, 3];
      const selectedOptionIndex = options.length - 1;
      const props = {
        ...propsWithSpies,
        optionsVisible: true,
        selectedOptionIndex,
        options
      };

      handler.handleArrowDown(fakeEvent, props);

      assert.isTrue(onSelectedOptionIndexChangeSpy.notCalled);

      assert.isTrue(preventDefaultSpy.calledOnce);
    });

    it('calls onOptionsVisibilityChanged with true and blanks out selected option when options are not visible', () => {
      const props = {
        ...propsWithSpies,
        optionsVisible: false
      };

      handler.handleArrowDown(fakeEvent, props);

      assert.isTrue(onSelectedOptionIndexChangeSpy.calledOnce);
      assert.isTrue(onSelectedOptionIndexChangeSpy.calledWith(null));

      assert.isTrue(onOptionsVisibilityChangedSpy.calledOnce);
      assert.isTrue(onOptionsVisibilityChangedSpy.calledWith(true));

      assert.isTrue(preventDefaultSpy.calledOnce);
    });
  });

  describe('handleArrowUp', () => {
    it('scrolls up when not at the top of the list', () => {
      const options = [1, 2, 3];
      const selectedOptionIndex = 1;
      const props = {
        ...propsWithSpies,
        selectedOptionIndex,
        options,
        optionsVisible: true
      };

      handler.handleArrowUp(fakeEvent, props);

      assert.isTrue(onSelectedOptionIndexChangeSpy.calledOnce);
      assert.isTrue(onSelectedOptionIndexChangeSpy.calledWith(0));

      assert.isTrue(setUsingMouseSpy.calledOnce);
      assert.isTrue(setUsingMouseSpy.calledWith(false));

      assert.isTrue(preventDefaultSpy.calledOnce);
    });

    it('sets index to null when at the top of the list', () => {
      const options = [1, 2, 3];
      const selectedOptionIndex = 0;
      const props = {
        ...propsWithSpies,
        selectedOptionIndex,
        options,
        optionsVisible: true
      };

      handler.handleArrowUp(fakeEvent, props);

      assert.isTrue(onSelectedOptionIndexChangeSpy.calledOnce);
      assert.isTrue(onSelectedOptionIndexChangeSpy.calledWith(null));

      assert.isTrue(setUsingMouseSpy.calledOnce);
      assert.isTrue(setUsingMouseSpy.calledWith(false));

      assert.isTrue(preventDefaultSpy.calledOnce);
    });

    it('does nothing when options are not visible', () => {
      const props = {
        ...propsWithSpies,
        optionsVisible: false
      };

      handler.handleArrowUp(fakeEvent, props);

      assert.isTrue(onSelectedOptionIndexChangeSpy.notCalled);
      assert.isTrue(setUsingMouseSpy.notCalled);
      assert.isTrue(preventDefaultSpy.notCalled);
    });
  });

  describe('handleEnter', () => {
    it('adds the selected option', () => {
      const options = [1, 2, 3];
      const selectedOptionIndex = 1;
      const props = {
        ...propsWithSpies,
        selectedOptionIndex,
        options,
        optionsVisible: true
      };

      handler.handleEnter(fakeEvent, props);

      assert.isTrue(onAddSelectedOptionSpy.calledOnce);
      assert.isTrue(onAddSelectedOptionSpy.calledWith(options[selectedOptionIndex]));

      assert.isTrue(preventDefaultSpy.calledOnce);
    });

    it('does nothing when no item is selected', () => {
      const options = [1, 2, 3];
      const selectedOptionIndex = null;
      const props = {
        ...propsWithSpies,
        selectedOptionIndex,
        options,
        optionsVisible: true
      };

      handler.handleEnter(fakeEvent, props);

      assert.isTrue(onAddSelectedOptionSpy.notCalled);
      assert.isTrue(preventDefaultSpy.notCalled);
    });

    it('does nothing when no item is selected', () => {
      const options = [1, 2, 3];
      const selectedOptionIndex = null;
      const props = {
        ...propsWithSpies,
        selectedOptionIndex,
        options,
        optionsVisible: true
      };

      handler.handleEnter(fakeEvent, props);

      assert.isTrue(onAddSelectedOptionSpy.notCalled);
      assert.isTrue(preventDefaultSpy.notCalled);
    });

    it('does nothing when options do not exist, even if there is a selected item', () => {
      const options = null;
      const selectedOptionIndex = 2;
      const props = {
        ...propsWithSpies,
        selectedOptionIndex,
        options,
        optionsVisible: true
      };

      handler.handleEnter(fakeEvent, props);

      assert.isTrue(onAddSelectedOptionSpy.notCalled);
      assert.isTrue(preventDefaultSpy.notCalled);
    });

    it('does nothing when option are not visible', () => {
      const options = [1, 2, 3];
      const selectedOptionIndex = 2;
      const props = {
        ...propsWithSpies,
        selectedOptionIndex,
        options,
        optionsVisible: false
      };

      handler.handleEnter(fakeEvent, props);

      assert.isTrue(onAddSelectedOptionSpy.notCalled);
      assert.isTrue(preventDefaultSpy.notCalled);
    });
  });

  describe('handleEscape', () => {
    it('hides the options', () => {
      const props = {
        ...propsWithSpies,
        optionsVisible: true
      };

      handler.handleEscape(fakeEvent, props);

      assert.isTrue(onOptionsVisibilityChangedSpy.calledOnce);
      assert.isTrue(onOptionsVisibilityChangedSpy.calledWith(false));

      assert.isTrue(preventDefaultSpy.calledOnce);
    });

    it('does nothing when options are already hidden', () => {
      const props = {
        ...propsWithSpies,
        optionsVisible: false
      };

      handler.handleEscape(fakeEvent, props);

      assert.isTrue(onOptionsVisibilityChangedSpy.notCalled);
      assert.isTrue(preventDefaultSpy.notCalled);
    });
  });

  describe('handleBackspace', () => {
    it('calls onRemoveSelectedOption when there is an option and the query is empty', () => {
      const selectedOptions = [1, 2, 3];
      const props = {
        ...propsWithSpies,
        currentQuery: '',
        selectedOptions
      };

      handler.handleBackspace(fakeEvent, props);

      assert.isTrue(onRemoveSelectedOptionSpy.calledOnce);
      assert.isTrue(onRemoveSelectedOptionSpy.calledWith(selectedOptions[selectedOptions.length - 1]));

      assert.isTrue(preventDefaultSpy.calledOnce);
    });

    it('does nothing when there are no selected options', () => {
      const selectedOptions = [];
      const props = {
        ...propsWithSpies,
        currentQuery: '',
        selectedOptions
      };

      handler.handleBackspace(fakeEvent, props);

      assert.isTrue(onRemoveSelectedOptionSpy.notCalled);
      assert.isTrue(preventDefaultSpy.notCalled);
    });

    it('does nothing when there is a query present', () => {
      const selectedOptions = [];
      const props = {
        ...propsWithSpies,
        currentQuery: 'test',
        selectedOptions
      };

      handler.handleBackspace(fakeEvent, props);

      assert.isTrue(onRemoveSelectedOptionSpy.notCalled);
      assert.isTrue(preventDefaultSpy.notCalled);
    });
  });
});
