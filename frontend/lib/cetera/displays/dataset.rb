module Cetera
  module Displays
    class Dataset < Base
      def self.name
        I18n.t('core.view_types.table')
      end

      def self.front_end_type
        'blist'
      end
    end
  end
end
