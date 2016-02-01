class ConfigurationTypesConfig < ExternalConfig
  attr_reader :type_descriptions

  def filename
    @filename ||= "#{Rails.root}/config/configuration_types.yml"
  end

  def update!
    Rails.logger.info("Config Update [#{uniqId}] from #{filename}")

    @type_descriptions = YAML.load_file(filename)
  end
end
