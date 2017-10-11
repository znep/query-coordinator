import { assert } from 'chai';
import React from 'react';
import { shallow } from 'enzyme';
import ManageData, { Card } from 'components/ManageData/ManageData';

describe('components/ManageData', () => {
  describe('ManageData', () => {
    const props = {
      hasDescribedCols: true,
      colsExist: () => {},
      onDescribeColsClick: () => {}
    };

    it('renders three cards: Describe Columns, Visualize, and Feature', () => {
      const component = shallow(<ManageData {...props} />);
      assert.equal(component.find('Card').length, 3);

      assert.equal(
        component
          .find('Card')
          .at(0)
          .prop('title'),
        I18n.home_pane.sidebar.column_descriptions
      );

      assert.equal(
        component
          .find('Card')
          .at(1)
          .prop('title'),
        I18n.home_pane.sidebar.visualize
      );

      assert.equal(
        component
          .find('Card')
          .at(2)
          .prop('title'),
        I18n.home_pane.sidebar.feature
      );
    });
  });

  describe('Card', () => {
    const props = {
      title: 'A Title',
      blurb: 'Some lame blurb',
      iconName: 'poop',
      done: true
    };
    it('renders a checkmark if done', () => {
      const component = shallow(
        <Card {...props}>
          <span>hey</span>
        </Card>
      );

      assert.equal(
        component
          .find('SocrataIcon')
          .filterWhere(elem => elem.prop('name') === 'checkmark-alt').length,
        1
      );
    });

    it('does not render a checkmark if not done', () => {
      const newProps = {
        ...props,
        done: false
      };

      const component = shallow(
        <Card {...newProps}>
          <span>hey</span>
        </Card>
      );

      assert.equal(
        component
          .find('SocrataIcon')
          .filterWhere(elem => elem.prop('name') === 'checkmark-alt').length,
        0
      );
    });

    it('renders chidren passed to it', () => {
      const component = shallow(
        <Card {...props}>
          <span>hey</span>
        </Card>
      );

      assert.isTrue(component.containsMatchingElement(<span>hey</span>));
    });
  });
});
