module Cetera
  module Displays
    class Form < Base
      def self.name
        I18n.t('core.view_types.form')
      end

      def self.front_end_type
        'form'
      end
    end
  end
end
