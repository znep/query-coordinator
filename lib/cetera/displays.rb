# Display types that Cetera search returns.
# Beginnings of deprecation of /app/models/displays which rely on View class
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
    #
    # Yes this can be much smaller but let's write it out long for now.

    class DataLens < Base
      def self.name
        I18n.t('core.view_types.data_lens')
      end

      def self.front_end_type
        'data_lens'
      end
    end

    class Story < Base
      def self.name
        I18n.t('core.view_types.story')
      end

      def self.front_end_type
        'story'
      end
    end

    class Pulse < Base
      def self.name
        I18n.t('core.view_types.pulse')
      end

      def self.front_end_type
        'pulse'
      end
    end

    class Dataset < Base
      def self.name
        I18n.t('core.view_types.table')
      end

      def self.front_end_type
        'blist'
      end
    end

    class Chart < Base
      def self.name
        I18n.t('core.view_types.chart')
      end

      def self.front_end_type
        'chart'
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

    class Calendar < Base
      def self.name
        I18n.t('core.view_types.calendar')
      end

      def self.front_end_type
        'calendar'
      end
    end

    class Filter < Base
      def self.name
        I18n.t('core.view_types.filter')
      end

      def self.front_end_type
        'filter'
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

    class File < Base
      def self.name
        I18n.t('core.view_types.blob')
      end

      def self.front_end_type
        'blob'
      end
    end

    class Form < Base
      def self.name
        I18n.t('core.view_types.form')
      end

      def self.front_end_type
        'form'
      end
    end

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
