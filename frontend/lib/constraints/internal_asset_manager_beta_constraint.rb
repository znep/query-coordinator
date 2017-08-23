require 'feature_flags/routing_constraint'

module Constraints
  class InternalAssetManagerBetaConstraint

    def matches?(request)
      FeatureFlags.derive(nil, request)[:enable_internal_asset_manager_beta]
    end
  end
end
