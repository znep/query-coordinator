module Cetera
  module Displays
    class Story < Base
      def self.name
        I18n.t('core.view_types.story')
      end

      def self.front_end_type
        'story'
      end

      # Use story icon from socrata-icons
      def self.icon_class
        'icon-story'
      end
    end
  end
end
