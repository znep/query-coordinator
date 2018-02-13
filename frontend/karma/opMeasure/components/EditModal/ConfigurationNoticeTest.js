import _ from 'lodash';
import { assert } from 'chai';
import sinon from 'sinon';
import { shallow } from 'enzyme';

import {
  ConfigurationNotice,
  mapStateToProps
} from 'opMeasure/components/EditModal/ConfigurationNotice';

describe('ConfigurationNotice', () => {
  describe('component', () => {
    let element;
    let defaultValidation;

    const getProps = (props) => ({
      onSectionClick: _.noop,
      validation: defaultValidation,
      ...props
    });

    describe('when there are no validation problems', () => {
      beforeEach(() => {
        defaultValidation = {
          calculation: {},
          dataSource: {},
          reportingPeriod: {}
        };
      });

      it('does not render', () => {
        element = shallow(<ConfigurationNotice {...getProps()} />);
        assert.isNotOk(element.node);
      });
    });

    describe('when there are validation problems', () => {
      beforeEach(() => {
        defaultValidation = {
          calculation: {},
          dataSource: { noDataSource: true },
          reportingPeriod: {}
        };
      });

      it('renders', () => {
        element = shallow(<ConfigurationNotice {...getProps()} />);
        assert.isOk(element.node);
      });

      xit('links to a support article');

      it('masks reporting period and calculation problems if the data source has problems', () => {
        const validation = {
          calculation: { noReferenceDateColumn: true },
          dataSource: { noDataSource: true },
          reportingPeriod: { noStartDate: true }
        };

        element = shallow(<ConfigurationNotice {...getProps({ validation })} />);
        assert.equal(element.find('span').first().text(), 'Data Source is not completely configured.');
      });

      describe('flannel', () => {
        const getFlannelHandle = (element) => element.children('a').first();
        const clickEvent = { preventDefault: _.noop };

        it('is not initially open', () => {
          element = shallow(<ConfigurationNotice {...getProps()} />);
          assert.lengthOf(element.find('#configuration-notice-flannel'), 0);
        });

        it('toggles open/closed when the "see tasks" link is clicked', () => {
          element = shallow(<ConfigurationNotice {...getProps()} />);
          getFlannelHandle(element).simulate('click', clickEvent);
          assert.lengthOf(element.find('#configuration-notice-flannel'), 1);
          getFlannelHandle(element).simulate('click', clickEvent);
          assert.lengthOf(element.find('#configuration-notice-flannel'), 0);
        });

        it('sets the active tab when "take me there" link is clicked', () => {
          const props = { onSectionClick: sinon.spy() };
          element = shallow(<ConfigurationNotice {...getProps(props)} />);
          getFlannelHandle(element).simulate('click', clickEvent);

          const link = element.find('.configuration-notice-flannel-details a').first();
          link.simulate('click', _.extend({ target: { hash: '#foo' } }, clickEvent));
          sinon.assert.calledWith(props.onSectionClick, 'foo');
        });

        it('masks reporting period and calculation problems if the data source has problems', () => {
          const validation = {
            calculation: { noReferenceDateColumn: true },
            dataSource: { noDataSource: true },
            reportingPeriod: { noStartDate: true }
          };

          element = shallow(<ConfigurationNotice {...getProps({ validation })} />);
          getFlannelHandle(element).simulate('click', clickEvent);
          assert.lengthOf(element.find('.configuration-notice-flannel-details'), 1);
        });

        it('renders reporting period group above calculation group', () => {
          const validation = {
            calculation: { noReferenceDateColumn: true },
            dataSource: {},
            reportingPeriod: { noStartDate: true }
          };

          element = shallow(<ConfigurationNotice {...getProps({ validation })} />);
          getFlannelHandle(element).simulate('click', clickEvent);

          const groups = element.find('.configuration-notice-flannel-details');
          assert.lengthOf(groups, 2);
          assert.match(groups.at(0).find('h6').text(), /^Reporting Period/);
          assert.match(groups.at(1).find('h6').text(), /^Calculation/);
        });
      });
    });
  });

  describe('mapStateToProps', () => {
    it('passes a validation object', () => {
      const state = { editor: {} };
      const mapped = mapStateToProps(state);
      const groups = ['calculation', 'dataSource', 'reportingPeriod'];
      assert.hasAllKeys(mapped.validation, groups);
    });

    // see comments in mapStateToProps
    it('masks noPeriodSize when noPeriodType is true', () => {
      const state = { editor: {} };
      const mapped = mapStateToProps(state);

      assert.isTrue(mapped.validation.reportingPeriod.noPeriodType);
      assert.isFalse(mapped.validation.reportingPeriod.noPeriodSize);
    });

    // see comments in mapStateToProps
    it('masks numeric column choosing warnings when there are no numeric columns', () => {
      const state = {
        editor: {
          measure: {
            metricConfig: {
              type: 'sum'
            }
          }
        }
      };
      const mapped = mapStateToProps(state);

      assert.isTrue(mapped.validation.calculation.noNumericColumn);
      assert.isFalse(mapped.validation.calculation.noSumColumn);
    });
  });
});
