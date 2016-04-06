class ConfigurationTypesConfig < ExternalConfig
  attr_reader :type_descriptions

  def filename
    @filename ||= "#{Rails.root}/config/configuration_types.yml"
  end

  def update!
    Rails.logger.info("Config Update [#{uniqId}] from #{filename}")

    @type_descriptions = YAML.load_file(filename)
    @for_autocomplete = nil
  end

  def for_autocomplete(with_params = nil)
    @for_autocomplete ||= @type_descriptions.
      inject([]) do |memo, (type, description)|
        description ||= {}
        description['description'] ||= %q(Haven't written a description yet.)

        # The discourage_in_creation_ui.instead field may be a symbol that matches
        # an existing named route (the `:as` property). The below block will
        # automatically substitute the correct path for the route.
        if with_params.present? && description.key?('discourage_in_creation_ui')
          with_params = with_params.symbolize_keys
          instead = description['discourage_in_creation_ui']['instead']
          if instead.present?
            route = Rails.application.routes.named_routes.get(instead)
            if route.present?
              description['discourage_in_creation_ui']['instead'] =
                route.format(with_params.only(*route.required_parts))
            end
          end
        end

        description.each_key do |key|
          description[key] =
            case description[key]
            when Array then description[key].join(', ')
            else description[key]
            end
        end

        # Finish the injection.
        memo << description.merge({ name: type })
        memo
      end
  end

  def description_for(type)
    exclude = %w( property_type_checking default_config_name )
    @type_descriptions[type].try(:reject) { |k, _| exclude.include? k }
  end

  def default_config_name_for(type)
    @type_descriptions[type].try(:[], 'default_config_name') || type.titleize
  end

  def property_type_checking_for(type)
    @type_descriptions[type].try(:[], 'property_type_checking')
  end
end
