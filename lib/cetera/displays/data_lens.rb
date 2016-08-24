module Cetera
  module Displays
    class DataLens < Base
      def self.name
        I18n.t('core.view_types.data_lens')
      end

      def self.front_end_type
        'data_lens'
      end

      # Use cards icon from socrata-icons
      def self.icon_class
        'icon-cards'
      end
    end
  end
end
