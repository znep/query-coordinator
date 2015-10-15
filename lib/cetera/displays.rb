# Display types that Cetera search returns.
# Beginnings of deprecation of /app/models/displays which rely on View class

# 10/5/2015 - Cetera supports these types: %w(dataset file external map)
#
# Also add new types to cetera.rb (See display_title, display_class, and icon_class)
# TODO: it should not be necesary to update this in two difference places

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

      # NOTE: Right now, this means the front_end_type
      # TODO: No more type--replace with front_end_type and cetera_type
      def self.type
        front_end_type
      end

      # Access the front end name for this type of display
      def self.front_end_type
        name.underscore
      end

      # Allow for customization of the CSS icon class, e.g. for icon font
      def self.icon_class
        'icon'
      end
    end

    ##############
    # Cetera types

    class Dataset < Base
      def self.name
        I18n.t('core.view_types.table')
      end

      def self.front_end_type
        'blist'
      end
    end

    class File < Base
      def self.name
        I18n.t('core.view_types.blob')
      end

      def self.front_end_type
        'blob'
      end
    end

    class Link < Base
      def self.name
        I18n.t('core.view_types.href')
      end

      def self.front_end_type
        'href'
      end
    end

    class Map < Base
      def self.name
        I18n.t('core.view_types.map')
      end

      def self.front_end_type
        'map'
      end
    end
  end
end
