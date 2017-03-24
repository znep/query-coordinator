module Constraints

  class CatalogLandingPageConstraint

    PARAM_WHITELIST = %w(category tags)

    def matches?(request)
      return false unless FeatureFlags.derive(nil, request)['enable_catalog_landing_page']

      clp_config = CurrentDomain.configuration(:catalog_landing_page)
      return false unless clp_config.present?

      return true if clp_config.properties.keys.include?(request.path)

      # TODO: I have no idea why this is here, instead of inside catalog_query.
      CurrentDomain.property(:custom_facets, :catalog).tap do |custom_facets|
        PARAM_WHITELIST.concat(custom_facets.map(&:param)) if custom_facets.present?
      end

      clp_config.properties.keys.include?(self.class.catalog_query(request.params))
    end

    # This helper method is also used by CatalogLandingPageController
    def self.catalog_query(params)
      to_param = lambda do |key, value|
        case value
          when Array then value.map { |v| "#{key}[]=#{v}" }
          else "#{key}=#{value}"
        end
      end

      CGI.escape!(params.slice(*PARAM_WHITELIST).map(&to_param).flatten.sort.join('&'))
    end

  end

end
