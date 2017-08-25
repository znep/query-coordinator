import React from 'react';

export default class LoadingSpinner extends React.Component {
  render() {
    return (
      <div className='loading-in-progress'>
        <span className='spinner-default spinner-large'/>
      </div>
    );
  }
}
