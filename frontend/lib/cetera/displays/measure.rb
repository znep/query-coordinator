module Cetera
  module Displays
    class Measure < Base
      def self.name
        I18n.t('core.view_types.measure')
      end

      def self.front_end_type
        'measure'
      end

      def self.icon_class
        'icon-op-measure'
      end
    end
  end
end
