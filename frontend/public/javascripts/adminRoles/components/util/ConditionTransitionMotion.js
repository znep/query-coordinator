// Yoinked from https://github.com/tessenate/polyhedra-viewer/blob/e96d6ebe0b78c35ec7613d35a48914ada9967e46/src/components/ConditionTransitionMotion.js
/* Example
 <ConditionTransitionMotion
   condition={this.state.show}
   willEnter={() => ({ x: startX, opacity: 0 })}
   willLeave={() => ({ x: spring(startX), opacity: spring(0) })}
   style={{ x: spring(0), opacity: spring(1)}}>
 { ({x, opacity}) =>
 <div style={{ transform: `translateX(${x}px)`, opacity, }}>
 ...
 </div>
 }
 </ConditionTransitionMotion>
 */
import React from 'react';
import { TransitionMotion } from 'react-motion';

const ConditionTransitionMotion = ({ condition, style, children, ...props }) => {
  const styles = condition ? [{ key: 'single', style }] : [];
  return (
    <TransitionMotion styles={styles} {...props}>
      {interpolatedStyles =>
        <div>
          {interpolatedStyles.map(({ key, style }) =>
            <div key={key}>
              {children(style)}
            </div>
          )}
        </div>}
    </TransitionMotion>
  );
};

export default ConditionTransitionMotion;
