module Cetera
  module Displays
    class Filter < Base
      def self.name
        I18n.t('core.view_types.filter')
      end

      def self.front_end_type
        'filter'
      end
    end
  end
end
