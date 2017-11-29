import _ from 'lodash';
import { assert } from 'chai';
import { Simulate } from 'react-dom/test-utils';
import { shallow } from 'enzyme';

import { ReportingPeriodPanel } from 'components/EditModal/ReportingPeriodPanel';

describe('ReportingPeriodPanel', () => {
  const getProps = (props) => ({
    // TODO: default test props
    onChangeStartDate: _.noop,
    ...props
  });

  it('renders', () => {
    const element = shallow(<ReportingPeriodPanel {...getProps()} />);
    assert.ok(element);
  });
});
