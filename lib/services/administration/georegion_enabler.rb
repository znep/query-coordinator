require 'application_helper'

module Services
  module Administration
    class EnabledGeoregionsLimitMetError < StandardError
    end

    class GeoregionEnabler
      include ApplicationHelper

      attr_reader :maximum_enabled_count

      def initialize
        @maximum_enabled_count = 5 # Move to config?
      end

      def enable(curated_region)
        check_enabled_limit
        make_request(curated_region, true)
      end

      def disable(curated_region)
        make_request(curated_region, false)
      end

      def check_enabled_limit
        enabled_curated_regions = CuratedRegion.find_enabled
        if enabled_curated_regions.size >= maximum_enabled_count
          raise EnabledGeoregionsLimitMetError.new
        end
      end

      def make_request(curated_region, enabled)
        CoreServer::Base.connection.update_request(
          path(curated_region.id),
          { :enabledFlag => enabled }.to_json
        )
      end

      def path(id)
        "/#{CuratedRegion.service_name}/#{id}"
      end

    end
  end
end
