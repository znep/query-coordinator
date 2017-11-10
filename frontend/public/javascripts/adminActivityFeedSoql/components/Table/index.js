import React, { PureComponent } from 'react';
import classNames from 'classnames';

import Head from './Head';
import Body from './Body';

class Table extends PureComponent {

  render() {

    const tableClass = classNames('result-list-table table table-discrete table-condensed table-borderless');

    return (
      <div className="table-wrapper">
        <table className={tableClass}>
          <Head />
          <Body />
        </table>
      </div>
    );

  }
}

export default Table;
