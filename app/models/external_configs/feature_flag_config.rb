class FeatureFlagConfig < ExternalConfig
  extend Forwardable

  def_delegators :@feature_flags, :[], :each, :keys
  attr_reader :categories

  def filename
    @filename ||= "#{Rails.root}/config/feature_flags.yml"
  end

  def update!
    Rails.logger.info("Config Update [#{uniqId}] from #{filename}")

    @feature_flags = YAML.load_file(filename) || {}
    @categories = @feature_flags.collect { |_, fc| fc['category'] }.compact.uniq
  end
end
