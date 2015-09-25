require 'application_helper'

module Services
  module Administration
    class EnabledGeoregionsLimitMet < StandardError
    end

    class GeoregionEnabledToggler
      include ApplicationHelper

      def enable(curated_region)
        enabled_curated_regions = CuratedRegion.find_enabled
        if enabled_curated_regions.size >= 5
          raise EnabledGeoregionsLimitMet.new
        end
        make_request(curated_region, true)
      end

      def disable(curated_region)
        make_request(curated_region, false)
      end

      def make_request(curated_region, enabled)
        CoreServer::Base.connection.update_request(path(curated_region.id), {:enabledFlag => enabled}.to_json, {})
      end

      def path(id)
        "/#{CuratedRegion.service_name}/#{id}"
      end

    end
  end
end
