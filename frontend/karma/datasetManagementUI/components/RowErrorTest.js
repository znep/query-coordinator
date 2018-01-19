import { expect, assert } from 'chai';
import React from 'react';
import RowError from 'datasetManagementUI/components/RowError/RowError';

describe('components/RowError', () => {
  // react spits out DOM validation warnings if you don't do this
  const renderInTable = element =>
    renderPureComponent(
      <table>
        <thead>
          {element}
        </thead>
      </table>
    );

  it('renders without errors when there are nulls', () => {
    const element = renderInTable(
      <RowError
        row={{
          rowIdx: 123,
          rowError: {
            type: 'too_short',
            offset: 123,
            wanted: 4,
            got: 3,
            contents: [null, 'a', null]
          }
        }}
      />
    );
    assert.ok(element);
    assert.ok(element.querySelector('tr'));
    assert.equal(
      element.innerText,
      'Error Row 124Expected 4 columns, found 3Row content: ,"a",'
    );
  });

  it('renders without errors when there are not nulls', () => {
    const element = renderInTable(
      <RowError
        row={{
          rowIdx: 123,
          rowError: {
            type: 'too_short',
            offset: 123,
            wanted: 4,
            got: 3,
            contents: ['a', 'b', 'c']
          }
        }}
      />
    );
    assert.ok(element);
    assert.ok(element.querySelector('tr'));
    assert.equal(
      element.innerText,
      'Error Row 124Expected 4 columns, found 3Row content: "a","b","c"'
    );
  });
});
