import { assert } from 'chai';
import sinon from 'sinon';
import { Simulate } from 'react-dom/test-utils';
import { SaveButton } from 'components/SaveButton';
import { SaveStates } from 'lib/constants';

describe('SaveButton', () => {
  const getProps = (props) => {
    return {
      saveState: SaveStates.IDLE,
      isDirty: false,
      onClick: _.noop,
      ...props
    };
  };

  let element;

  const getSpinner = (el) => el.querySelector('.spinner-default');

  beforeEach(() => {
    element = renderComponent(SaveButton, getProps());
  });

  it('renders a button', () => {
    assert.ok(element);
    assert.match(element.className, /btn/);
  });

  it('is enabled when the page is dirty', () => {
    element = renderComponent(SaveButton, getProps({ isDirty: false }));
    assert.isTrue(element.disabled);

    element = renderComponent(SaveButton, getProps({ isDirty: true }));
    assert.isFalse(element.disabled);
  });

  it('renders a spinner if the save state is saving', () => {
    element = renderComponent(SaveButton, getProps({ saveState: SaveStates.SAVING }));
    assert.ok(getSpinner(element));
  });

  it('calls onClick when the button is clicked', () => {
    const onClick = sinon.spy();
    element = renderComponent(SaveButton, getProps({ isDirty: true, onClick }));

    sinon.assert.notCalled(onClick);
    Simulate.click(element);
    sinon.assert.calledOnce(onClick);
  });
});
