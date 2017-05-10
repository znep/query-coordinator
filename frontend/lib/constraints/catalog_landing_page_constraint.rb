module Constraints

  class CatalogLandingPageConstraint

    def matches?(request)
      return false unless FeatureFlags.derive(nil, request)['enable_catalog_landing_page']

      CatalogLandingPage.should_route?(request) && CatalogLandingPage.exists?(request)
    end

  end

end
