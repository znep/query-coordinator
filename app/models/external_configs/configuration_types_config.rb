class ConfigurationTypesConfig < ExternalConfig
  attr_reader :type_descriptions

  def filename
    @filename ||= "#{Rails.root}/config/configuration_types.yml"
  end

  def update!
    Rails.logger.info("Config Update [#{uniqId}] from #{filename}")

    @type_descriptions = YAML.load_file(filename)
  end

  def description_for(type)
    @type_descriptions[type].try(:reject) { |k, _| k == 'property_type_checking' }
  end

  def property_type_checking_for(type)
    @type_descriptions[type].try(:[], 'property_type_checking')
  end
end
