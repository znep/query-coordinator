import _ from 'lodash';
import { shallow } from 'enzyme';
import React from 'react';
import ReactDOM from 'react-dom';
import { assert } from 'chai';

import { MeasureTitle } from 'common/performance_measures/components/MeasureTitle';

describe('MeasureTitle', () => {
  it('prefers shortName', () => {
    assert.equal(
      shallow(
        <MeasureTitle lens={{ name: 'lens name' }} measure={{ metadata: { shortName: 'short name' } }} />
      ).text(),
      'short name'
    );
  });

  it('falls back to lens name', () => {
    assert.equal(
      shallow(
        <MeasureTitle lens={{ name: 'lens name' }} measure={{ metadata: {} }} />
      ).text(),
      'lens name'
    );
  });
});
