import sinon from 'sinon';
import { expect, assert } from 'chai';
import { Simulate } from 'react-addons-test-utils';
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
    expect(element.className).to.match(/btn/);
  });

  it('is enabled when the page is dirty', () => {
    element = renderComponent(SaveButton, getProps({ isDirty: false }));
    expect(element.disabled).to.equal(true);

    element = renderComponent(SaveButton, getProps({ isDirty: true }));
    expect(element.disabled).to.equal(false);
  });

  it('renders a spinner if the save state is saving', () => {
    element = renderComponent(SaveButton, getProps({ saveState: SaveStates.SAVING }));
    assert.ok(getSpinner(element));
  });

  it('calls onClick when the button is clicked', () => {
    const onClick = sinon.spy();
    element = renderComponent(SaveButton, getProps({ isDirty: true, onClick }));

    expect(onClick.called).to.equal(false);
    Simulate.click(element);
    expect(onClick.called).to.equal(true);
  });
});
