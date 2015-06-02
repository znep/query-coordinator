class ExternalConfig

  @@configs = {}
  def self.register(config)
    @@configs[config.uniqId] ||= config
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
    ExternalConfig.register(self)
  end
  attr_reader :uniqId, :filename

  def has_changed?
    return false if @cache > Time.now
    @cache = Time.now + cache_period

    begin
      mtime = File.mtime(filename)
    rescue Errno::ENOENT
      Rails.logger.error("Config file for #{uniqId} does not exist. Looking in #{filename}")
    end
    has_changed = @last_updated.nil? || mtime > @last_updated
    @last_updated = mtime
    has_changed
  end

  def cache_period
    # Implement me if you want caching. Caching is silly.
    0.seconds
  end

  def uncache!
    @cache = Time.now
  end

  def update!
    # Implement this method in a subclass. Required.
    # Example implementation:
    #
    # Rails.logger.info("Config Update [#{uniqId}] from #{filename}")
    # @things = YAML.load_file(filename)
    # do_things!
    raise NotImplementedError.new "#{self.class}#update!"
  end
end
