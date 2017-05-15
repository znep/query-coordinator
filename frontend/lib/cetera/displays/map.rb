module Cetera
  module Displays
    class Map < Base
      def self.name
        I18n.t('core.view_types.map')
      end

      def self.front_end_type
        'map'
      end
    end
  end
end
