import React from 'react';

export class Header extends React.Component {
  render() {
    return (
      <div className="header">
        {/* TODO: toggle for the My Assets / All Assets, and the asset counts */}
        <span>All Assets</span>
      </div>
    );
  }
}

export default Header;
