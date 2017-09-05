import { assert } from 'chai';
import sinon from 'sinon';

import { EditBar } from 'components/EditBar';

describe('EditBar', () => {
  const getProps = (props) => {
    return {
      name: 'Test Measure',
      ...props
    };
  };

  it('renders', () => {
    const element = renderComponent(EditBar, getProps());
    assert.ok(element);
  });

  it('displays the measure name', () => {
    const element = renderComponent(EditBar, getProps());
    const nameElement = element.querySelector('.page-name');
    assert.ok(nameElement);
    assert.equal(nameElement.innerText, 'Test Measure');
  });

  it('renders a preview button', () => {
    const element = renderComponent(EditBar, getProps());
    assert.ok(element.querySelector('.btn-preview'));
  });

  it('invokes onClickPreview on preview click', () => {
    const onClickSpy = sinon.spy();
    const element = renderComponentWithStore(EditBar, getProps({
      onClickPreview: onClickSpy
    }));

    TestUtils.Simulate.click(element.querySelector('.btn-preview'));

    sinon.assert.called(onClickSpy);
  });
});
