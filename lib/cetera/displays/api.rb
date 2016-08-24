module Cetera
  module Displays
    class Api < Base
      def self.name
        I18n.t('core.view_types.api')
      end

      def self.front_end_type
        'api'
      end
    end
  end
end
