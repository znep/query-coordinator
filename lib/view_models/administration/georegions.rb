module ViewModels
  module Administration
    class Georegions
      attr_reader :default_regions
      attr_reader :custom_regions

      def initialize(curated_georegions)
        @curated_regions = curated_georegions
        @default_regions, @custom_regions = curated_georegions.partition(&:default?)
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
