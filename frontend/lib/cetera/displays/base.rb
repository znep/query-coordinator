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

      # NOTE: icon_class is used to distinguish between view type icons in
      # /stylesheets/images/icons/type_icons_50.png and view type icons in the socrata-icons font
      def self.icon_class
        'icon'
      end
    end
  end
end
