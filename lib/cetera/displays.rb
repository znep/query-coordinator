# Display types that Cetera search returns.
# Beginnings of deprecation of /app/models/displays which rely on View class

# 9/26/2015 - Cetera currently only supports types `dataset` and `page`. We will need to add
# new display types as they are supported by Cetera to enable them.
# Also add new types to cetera.rb (See display_title, display_class, and icon_class)

module Cetera
  module Displays

    # Base class for all displays
    class Base

        # Access the human readable name for this type of display
        def self.name
          self.class.name
        end

        def self.title
          name.capitalize
        end

        # Access the internal name for this type of display
        def self.type
          name.underscore
        end

        # Allow for customization of the CSS icon class, e.g. for icon font
        def self.icon_class
          'icon'
        end
    end

    class Dataset < Base

      def self.name
        I18n.t('core.view_types.table')
      end

      def self.type
        'blist'
      end

      def self.cetera_type
        'dataset'
      end
    end

    class Page < Base

      def self.name
        I18n.t('core.view_types.new_view')
      end

      def self.type
        'new_view'
      end

      def self.cetera_type
        'page'
      end

      def self.title
        name
      end

      def self.icon_class
        'icon-cards'
      end
    end
  end
end
