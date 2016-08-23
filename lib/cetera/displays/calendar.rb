module Cetera
  module Displays
    class Calendar < Base
      def self.name
        I18n.t('core.view_types.calendar')
      end

      def self.front_end_type
        'calendar'
      end
    end
  end
end
