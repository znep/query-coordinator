class ExternalConfig
  # External Configs are configurations wrapped around files that we
  # anticipate changes pushed to from external sources. In order to
  # update the Rails configuration to match these without requiring
  # a restart, we simply watch those files for changes and react by
  # updating our state appropriately.
  #
  # ExternalConfig is an abstract class for handling it.
  # Please make sure to throw in some logging to your subclass.

  @@configs = {}
  def self.for(uniqId)
    @@configs[uniqId] ||= begin
                            "#{uniqId.capitalize}Config".constantize.new
                          rescue NameError
                            Rails.logger.error("Please define the config classname correctly.")
                            raise
                          end
  end

  def self.update_all!
    @@configs.each do |_, config|
      config.update! if config.has_changed?
    end
  end

  def initialize#(uniqId, filename)
    uncache!
    update!
  end
  attr_reader :uniqId, :filename

  def uniqId
    @uniqId ||= self.class.name[0...-6].downcase.to_sym
  end

  def filename
    @filename || (raise NotImplementedError.new "#{self.class.name} has no associated file!")
  end

  def has_changed?
    return false if @cache > Time.now
    @cache = Time.now + cache_period

    has_changed = false
    begin
      mtime = File.mtime(filename)
      has_changed = @last_updated.nil? || mtime > @last_updated
    rescue Errno::ENOENT
      Rails.logger.error("Config file for #{uniqId} does not exist. Looking in #{filename}")
    end
    @last_updated = mtime
    has_changed
  end

  def cache_period
    # Implement me if you want caching. Caching is silly.
    0.seconds
  end

  def uncache!
    # If you implement #cache_period, you should expose this method as an endpoint
    # so that we can do hacky surgery in an emergency.
    @cache = Time.now
  end

  def update!
    # Implement this method in a subclass. Required.
    # NOTE: Implement this method defensively, with sane defaults and lots of error handling.
    # Example implementation:
    #
    # Rails.logger.info("Config Update [#{uniqId}] from #{filename}")
    # @things = YAML.load_file(filename)
    # do_things!
    raise NotImplementedError.new "#{self.class}#update!"
  end
end
