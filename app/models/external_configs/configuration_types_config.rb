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

        if instead = instead_for_discouragement(description, with_params)
          description['discourage_in_creation_ui']['instead'] = instead
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
    exclude = %w( property_type_checking default_config_name discourage_in_creation_ui )
    @type_descriptions[type].try(:reject) { |k, _| exclude.include? k }
  end

  def discouragement_because(reason, options = {})
    case reason
    when :poorly_understood
      %(This configuration is poorly understood or unknown, so if you're using this, please help document what it does.)
    when :not_intended_for_direct_manipulation
      message = %(This configuration is not intended for direct manipulation, so you probably shouldn't be creating it manually.)
      if options[:force_instead] || (instead = instead_for_discouragement(options[:type], options[:with_params]))
        message << %( <span class="instead">Try going to <a href="#{instead}">this page</a> instead.</span>)
      end
      message
    when :deprecation
      %(This configuration has been deprecated. It <i>should</i> do nothing even if you create it. Please don't create it.)
    end.html_safe
  end

  def discouragement_for(type, with_params = nil)
    reason = @type_descriptions[type].try(:[], 'discourage_in_creation_ui').try(:[], 'reason')
    discouragement_because(reason, type: type, with_params: with_params) if reason.present?
  end

  def default_config_name_for(type)
    @type_descriptions[type].try(:[], 'default_config_name') || type.titleize
  end

  def property_type_checking_for(type)
    @type_descriptions[type].try(:[], 'property_type_checking')
  end

  private

  # The discourage_in_creation_ui.instead field may be a symbol that matches
  # an existing named route (the `:as` property). The below block will
  # automatically substitute the correct path for the route.
  def instead_for_discouragement(type_or_description, with_params = nil)
    description =
      case type_or_description
      when String then @type_descriptions[type_or_description]
      else type_or_description
      end

    if with_params.present? && description.key?('discourage_in_creation_ui')
      with_params = with_params.symbolize_keys
      instead = description['discourage_in_creation_ui']['instead']
      if instead.present?
        route = Rails.application.routes.named_routes.get(instead)
        if route.present?
          route.format(with_params.only(*route.required_parts))
        end
      end
    end
  end
end
