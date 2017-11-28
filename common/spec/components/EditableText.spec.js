import React from 'react';
import ReactDOM from 'react-dom';
import { Simulate } from 'react-dom/test-utils';
import $ from 'jquery';
import EditableText from 'components/EditableText';
import { renderComponent } from '../helpers';
import { ENTER, ESCAPE } from 'common/dom_helpers/keycodes_deprecated';

describe('EditableText', () => {
  let container;
  let props;
  let comp;

  before(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  beforeEach(() => {
    props = {
      text: 'Valid Text',
      onTextChanged: sinon.stub()
    };
    comp = React.createElement(EditableText, props);
    ReactDOM.render(comp, container);
  });

  afterEach(() => ReactDOM.unmountComponentAtNode(container));

  after(() => $(container).remove());

  const find = (selector) => {
    return $(document.body).find(selector);
  };

  it('renders the text in props', () => {
    const test = find('.editable-text-value');
    assert.equal(test.length, 1);
    assert.equal(test.text(), props.text);
  });

  it('shows border and edit button on mouse over', () => {
    const display = find('.editable-text-display');

    Simulate.mouseOver(display[0]);

    const highlightedDisplay = find('.editable-text-display.highlight');
    assert.equal(highlightedDisplay.length, 1);
  });

  it('shows border and edit button on focus', () => {
    const display = find('.editable-text-display');

    display.focus();

    const highlightedDisplay = find('.editable-text-display.highlight');
    assert.equal(highlightedDisplay.length, 1);
  });

  it('renders <input> when ENTER pressed while focused', () => {
    const display = find('.editable-text-display');

    display.focus();
    Simulate.keyUp(display[0], { keyCode: ENTER });

    const input = find('input');
    assert.equal(input.length, 1);
  });

  it('hides border and edit button on mouse out', () => {
    const display = find('.editable-text-display');

    Simulate.mouseOver(display[0]);
    Simulate.mouseOut(display[0]);

    const highlightedDisplay = $(comp).find('.editable-text-display.highlight');
    assert.equal(highlightedDisplay.length, 0);
  });

  it('renders an <input> after click', () => {
    const display = find('.editable-text-display');

    Simulate.mouseOver(display[0]);
    Simulate.click(display[0]);

    const btn = find('.editable-text-btn')[0];
    assert.isUndefined(btn);

    const input = find('input')[0];
    assert.isDefined(input);
    assert.equal(input.name, 'text');
  });

  it('calls onTextChanged when text is changed', () => {
    const updatedText = 'Updated Text';

    const display = find('.editable-text-display');

    Simulate.mouseOver(display[0]);
    Simulate.click(display[0]);

    const input = find('input');
    input.val(updatedText);

    // Simulate.keyPress(input[0], { keyCode: ENTER }); // NOTE: Does not submit the form.
    Simulate.submit(find('form')[0]);

    sinon.assert.calledOnce(props.onTextChanged);
    sinon.assert.alwaysCalledWith(props.onTextChanged, updatedText);
  });

  it('pressing ESC cancels editing', () => {
    const updatedText = 'Updated Text';

    const display = find('.editable-text-display');

    Simulate.mouseOver(display[0]); // Maybe not needed, but closer to reality.
    Simulate.click(display[0]);

    const input = find('input');
    input.val(updatedText);

    // Cancel via ESC
    Simulate.keyDown(input[0], { keyCode: ESCAPE });

    sinon.assert.notCalled(props.onTextChanged);
  });

  it('does not call onTextChanged when text not changed', () => {
    const updatedText = 'Updated Text';

    const display = find('.editable-text-display');

    Simulate.mouseOver(display[0]);
    Simulate.click(display[0]);

    Simulate.submit(find('form')[0]);

    sinon.assert.notCalled(props.onTextChanged);
  });

  it('calls onTextChanged on click outside, when text is changed', () => {
    const updatedText = 'Updated Text';

    const display = find('.editable-text-display');

    Simulate.mouseOver(display[0]);
    Simulate.click(display[0]);

    const input = find('input');
    input.val(updatedText);

    const content = $('<div>Here is some regular text</div>');
    document.body.appendChild(content[0]);

    content.click();

    sinon.assert.calledOnce(props.onTextChanged);
    sinon.assert.alwaysCalledWith(props.onTextChanged, updatedText);

    content.remove();
  });
});
