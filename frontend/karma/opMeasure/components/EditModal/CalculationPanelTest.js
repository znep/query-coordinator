import _ from 'lodash';
import { assert } from 'chai';
import sinon from 'sinon';
import { Simulate } from 'react-dom/test-utils';
import { shallow } from 'enzyme';

import { CalculationPanel, mapStateToProps } from 'components/EditModal/CalculationPanel';

describe('CalculationPanel', () => {
  describe('calculator buttons', () => {
    it('calls the onSetCalculationType with correct type', () => {
      const props = {
        hasDataSource: true,
        onSetCalculationType: sinon.stub(),
        calculationType: 'count'
      };

      const element = shallow(<CalculationPanel {...props} />);

      const countBtn = element.find('.count-calculation');
      countBtn.simulate('click');
      sinon.assert.alwaysCalledWith(props.onSetCalculationType, 'count');

      props.onSetCalculationType.reset();

      const sumBtn = element.find('.sum-calculation');
      sumBtn.simulate('click');
      sinon.assert.alwaysCalledWith(props.onSetCalculationType, 'sum');

      props.onSetCalculationType.reset();

      const recentValueBtn = element.find('.recent-calculation');
      recentValueBtn.simulate('click');
      sinon.assert.alwaysCalledWith(props.onSetCalculationType, 'recent_value');
    });
  });
});
