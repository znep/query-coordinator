class FeatureFlagConfig < ExternalConfig

  extend Forwardable

  def_delegators :@feature_flags, :[], :each, :keys, :key?

  attr_reader :categories

  def filename
    @filename ||=
      if FeatureFlags.using_signaller?
        FeatureFlags.feature_flag_signaller_uri
      else
        "#{Rails.root}/config/feature_flags.yml"
      end
  end

  def cache_period
    FeatureFlags.using_signaller? ? 5.minutes : 0
  end

  def update!
    Rails.logger.info("Config Update [#{uniqId}] from #{filename}")

    @feature_flags =
      if FeatureFlags.using_signaller?
        FeatureFlags.descriptions
      else
        YAML.load_file(filename) || {}
      end.with_indifferent_access

    category_list = @feature_flags.collect { |_, fc| fc['category'] }.compact.uniq
    @categories = category_list.inject({}) do |memo, category|
      memo[category] = @feature_flags.dup.keep_if { |_, fc| category == fc['category'] }.keys
      memo
    end
  end

end
