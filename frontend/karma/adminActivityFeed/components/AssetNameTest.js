import _ from 'lodash';
import immutable from 'immutable';
import { expect, assert } from 'chai';

import testStore from '../testStore';
import AssetName from 'components/AssetName';

describe('AssetName', () => {
  const renderAssetName = (activity) => {
    return renderComponentWithLocalization(AssetName, { activity }, testStore());
  };

  it('should render asset name as link if activity type is not delete', () => {
    const activity = immutable.fromJS({
      data: {
        activity_type: 'Upsert'
      },
      dataset: {
        name: 'Some Dataset',
        id: 'xxxx-xxxx'
      }
    });

    const output = renderAssetName(activity);
    expect(output.tagName).to.eq('A');
    expect(output.textContent).to.eq('Some Dataset');
  });

  it('should render asset name as plain text if activity type is delete', () => {
    const activity = immutable.fromJS({
      data: {
        activity_type: 'Delete'
      },
      dataset: {
        name: 'Some Dataset',
        id: 'xxxx-xxxx'
      }
    });

    const output = renderAssetName(activity);
    expect(output.tagName).to.eq('SPAN');
    expect(output.textContent).to.eq('Some Dataset');
  });
});
