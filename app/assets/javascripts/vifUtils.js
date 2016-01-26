(function(root) {

  'use strict';

  var socrata = root.socrata = root.socrata || {};
  var storyteller = socrata.storyteller = socrata.storyteller || {};

  storyteller.vifsAreEquivalent = function(vif1, vif2) {
    var vif1Clone = _.cloneDeep(vif1);
    var vif2Clone = _.cloneDeep(vif2);

    // The 'createdAt' property is updated when a visualization is added to the
    // story, but if everything else is the same the two visualizations are
    // equivalent anyway. We can therefore delete this key from the two cloned
    // vifs and measure functional equality using _.isEqual().
    delete vif1Clone.createdAt;
    delete vif2Clone.createdAt;

    return _.isEqual(vif1Clone, vif2Clone);
  };
})(window);
