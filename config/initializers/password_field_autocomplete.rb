module ActionView
  module Helpers
    module FormTagHelper
      def password_field_tag(name = "password", value = nil, options = {})
        text_field_tag(name, value, options.update("type" => "password", "autocomplete" => "off"))
      end
    end

    module FormHelper
      def password_field(object_name, method, options = {})
        InstanceTag.new(object_name, method, self, options.delete(:object)).to_input_field_tag("password", options.update("autocomplete" => "off"))
      end
    end
  end
end
