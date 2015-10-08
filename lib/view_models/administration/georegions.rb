module ViewModels
  module Administration
    class Georegions
      attr_reader :default_regions
      attr_reader :custom_regions
      attr_reader :curated_regions
      attr_reader :maximum_enabled_count
      attr_reader :site_title

      def initialize(curated_georegions, site_title)
        @curated_regions = curated_georegions
        @default_regions, @custom_regions = curated_georegions.partition(&:default?)
        @maximum_enabled_count = 5 # Move to config?
        @site_title = site_title
      end

      def enabled_count
        @curated_regions.count(&:enabled?)
      end

      def available_count
        @curated_regions.count
      end

      def allow_enablement?
        enabled_count < @maximum_enabled_count
      end

      def translations
        LocalePart.screens.admin.georegions
      end

    end
  end
end
