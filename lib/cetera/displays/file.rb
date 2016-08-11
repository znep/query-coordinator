module Cetera
  module Displays
    class File < Base
      def self.name
        I18n.t('core.view_types.blob')
      end

      def self.front_end_type
        'blob'
      end
    end
  end
end
