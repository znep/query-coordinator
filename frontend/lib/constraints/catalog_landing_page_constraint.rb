require 'feature_flags/routing_constraint'

module Constraints
  class CatalogLandingPageConstraint
    include FeatureFlags::RoutingConstraintMixin
    test_feature_flags!(enable_catalog_landing_page: true)

    def matches?(request)
      return false unless passes_feature_flag_test?(request)

      CatalogLandingPage.should_route?(request) && CatalogLandingPage.exists?(request)
    end
  end
end
