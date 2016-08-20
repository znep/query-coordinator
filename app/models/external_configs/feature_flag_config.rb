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

    if FeatureFlags.using_signaller?
      @feature_flags = FeatureFlags.connect_to_signaller do
        uri = FeatureFlags.endpoint(with_path: '/describe.json')
        JSON.parse(HTTParty.get(uri).body)
      end.with_indifferent_access
    else
      @feature_flags = (YAML.load_file(filename) || {}).with_indifferent_access
    end

    category_list = @feature_flags.collect { |_, fc| fc['category'] }.compact.uniq
    @categories = category_list.inject({}) do |memo, category|
      memo[category] = @feature_flags.dup.keep_if { |_, fc| category == fc['category'] }.keys
      memo
    end
  end

end
