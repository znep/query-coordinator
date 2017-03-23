require 'application_helper'

module Services
  module Administration
    class IneligibleDefaultGeoregionError < StandardError
    end

    class DefaultGeoregionsLimitMetError < StandardError
    end

    class GeoregionDefaulter
      include ApplicationHelper

      attr_reader :maximum_default_count

      def initialize
        @maximum_default_count = 5 # Move to config?
      end

      def default(curated_region)
        check_enabled(curated_region)
        check_default_limit
        make_request(curated_region, true)
      end

      def undefault(curated_region)
        make_request(curated_region, false)
      end

      def check_enabled(curated_region)
        unless curated_region.enabled?
          raise IneligibleDefaultGeoregionError.new
        end
      end

      def check_default_limit
        default_curated_regions = CuratedRegion.find_default
        if default_curated_regions.size >= maximum_default_count
          raise DefaultGeoregionsLimitMetError.new
        end
      end

      def make_request(curated_region, default)
        CoreServer::Base.connection.update_request(
          path(curated_region.id),
          {
            :defaultFlag => default
          }.to_json
        )
      end

      def path(id)
        "/#{CuratedRegion.service_name}/#{id}"
      end
    end
  end
end
