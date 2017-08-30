import { assert } from 'chai';

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
});
