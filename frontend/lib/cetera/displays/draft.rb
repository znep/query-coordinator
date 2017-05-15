module Cetera
  module Displays
    class Draft < Base
      def self.name
        I18n.t('core.view_types.draft')
      end

      def self.front_end_type
        'draft'
      end
    end
  end
end
