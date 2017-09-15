import PropTypes from 'prop-types';
import React from 'react';

export class FeaturedContentViewCardPlaceholder extends React.Component {
  render() {
    const onClick = (e) => {
      e.preventDefault();
      this.props.openManager(this.props.position);
    };

    return (
      <div className="result-card view-card media placeholder">
        <button className="add-button btn btn-primary" onClick={onClick}>
          Add...
        </button>
      </div>
    );
  }
}

FeaturedContentViewCardPlaceholder.propTypes = {
  position: PropTypes.number.isRequired,
  openManager: PropTypes.func.isRequired
};

export default FeaturedContentViewCardPlaceholder;
