class DowntimeConfig < ExternalConfig
  include Enumerable
  extend Forwardable

  def_delegator :@downtimes, :each

  def filename
    return nil if use_consul?
    @filename ||= "#{Rails.root}/config/downtime.yml"
  end

  def update!
    source = (use_consul?) ? consul_key : filename

    Rails.logger.info("Config Update [#{uniqId}] from #{source}")

    @downtimes ||= []

    begin
      if use_consul? then
        yaml = YAML.load(Diplomat::Kv.get(source))
      else
        yaml = YAML.load_file(source)
      end

      if yaml
        @downtimes = [yaml[Rails.env]].flatten.compact.collect do |time|
          Downtime.new(time['message_start'], time['message_end'],
                       time['downtime_start'], time['downtime_end'])
        end
        Rails.logger.info("Downtimes loaded! #{@downtimes.inspect}")
      else
        Rails.logger.warn("Unable to load downtime banner: #{source}")
      end
    rescue StandardError => e
      # Ignore all errors/typos from the downtime parsing
      Rails.logger.warn("Error loading downtime banner: #{source} - #{e}")
    end
  end

private
  def use_consul?
    return !APP_CONFIG['consul_host'].to_s.blank?
  end

  def consul_key
    'config/frontend/downtime'
  end
end
