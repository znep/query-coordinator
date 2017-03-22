module Cetera
  module Displays
    class Pulse < Base
      def self.name
        I18n.t('core.view_types.pulse')
      end

      def self.front_end_type
        'pulse'
      end
    end
  end
end
