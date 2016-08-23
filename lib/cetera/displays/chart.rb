module Cetera
  module Displays
    class Chart < Base
      def self.name
        I18n.t('core.view_types.chart')
      end

      def self.front_end_type
        'chart'
      end
    end
  end
end
