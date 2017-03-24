module Cetera
  module Displays
    class Link < Base
      def self.name
        I18n.t('core.view_types.href')
      end

      def self.front_end_type
        'href'
      end
    end
  end
end
