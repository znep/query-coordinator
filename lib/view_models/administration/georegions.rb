module ViewModels
  module Administration
    class Georegions
      attr_reader :default_regions
      attr_reader :custom_regions
      attr_reader :curated_regions
      attr_reader :maximum_enabled_count

      def initialize(curated_georegions)
        @curated_regions = curated_georegions
        @default_regions, @custom_regions = curated_georegions.partition(&:default?)
        @maximum_enabled_count = 5 # Move to config?
      end

      def enabled_count
        @curated_regions.count(&:enabled?)
      end

      def available_count
        @curated_regions.count
      end

      def translations
        LocalePart.screens.admin.georegions
      end

    end
  end
end
