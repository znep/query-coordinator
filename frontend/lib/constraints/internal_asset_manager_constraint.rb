module Constraints

  class InternalAssetManagerConstraint

    def matches?(request)
      FeatureFlags.derive(nil, request)['enable_internal_asset_manager']
    end

  end

end
