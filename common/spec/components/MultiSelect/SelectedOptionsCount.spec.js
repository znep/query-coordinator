import React from 'react';
import { mount } from 'enzyme';
import { assert } from 'chai';
import SelectedOptionsCount from 'common/components/MultiSelect/SelectedOptionsCount';

describe('<SelectedOptionsCount />', () => {
  it('shows when less than the max', () => {
    const maxSelectedOptions = 5;
    const selectedOptions = [1, 2, 3];

    const wrapper = mount(
      <SelectedOptionsCount
        maxSelectedOptions={maxSelectedOptions}
        selectedOptions={selectedOptions} />
    );

    assert.equal(wrapper.text(), `${selectedOptions.length} / ${maxSelectedOptions}`);
  });

  it('shows when at the max', () => {
    const maxSelectedOptions = 5;
    const selectedOptions = [1, 2, 3, 4, 5];

    const wrapper = mount(
      <SelectedOptionsCount
        maxSelectedOptions={maxSelectedOptions}
        selectedOptions={selectedOptions} />
    );

    assert.equal(wrapper.text(), `${selectedOptions.length} / ${maxSelectedOptions}`);
  });

  it('shows when above the max', () => {
    // note that going above the max is prevented in other places
    // theoretically, consumer of the component can pass in whatever selectedOptions they want though
    const maxSelectedOptions = 5;
    const selectedOptions = [1, 2, 3, 4, 5, 6];

    const wrapper = mount(
      <SelectedOptionsCount
        maxSelectedOptions={maxSelectedOptions}
        selectedOptions={selectedOptions} />
    );

    assert.equal(wrapper.text(), `${selectedOptions.length} / ${maxSelectedOptions}`);
  });
});
