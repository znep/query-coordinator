class ExternalConfig

  @@configs = {}
  def self.register(uniqId, filename)
    @@configs[uniqId] ||= ExternalConfig.new(uniqId, filename)
  end

  def self.for(uniqId)
    @@configs[uniqId]
  end

  def self.update_all!
    @@configs.each do |_, config|
      config.update! if config.has_changed?
    end
  end

  def initialize(uniqId, filename)
    @uniqId = uniqId
    @filename = filename
    uncache!
    update!
  end
  attr_reader :uniqId, :filename

  def has_changed?
    return false if @cache > Time.now
    @cache = Time.now + cache_period

    mtime = File.mtime(filename)
    has_changed = @last_updated.nil? || mtime > @last_updated
    @last_updated = mtime
    has_changed
  end

  def cache_period
    # Implement me
    0.seconds
  end

  def uncache!
    @cache = Time.now
  end

  def update!
    # Example implementation:
    #
    # @config = YAML.load_file(filename)
  end
end
