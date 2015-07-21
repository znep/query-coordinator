class DowntimeConfig < ExternalConfig
  include Enumerable
  extend Forwardable

  def_delegator :@downtimes, :each

  def filename
    @filename ||= "#{Rails.root}/config/downtime.yml"
  end

  def update!
    Rails.logger.info("Config Update [#{uniqId}] from #{filename}")
    @downtimes ||= []
    begin
      yaml = YAML.load_file(filename)
      if yaml
        @downtimes = [yaml[Rails.env]].flatten.compact.collect do |time|
          Downtime.new(time['message_start'], time['message_end'],
                       time['downtime_start'], time['downtime_end'])
        end
        Rails.logger.info("Downtimes loaded! #{@downtimes.inspect}")
      else

        Rails.logger.warn("Unable to load downtime banner file: #{filename}")
      end
    rescue StandardError => e
      # Ignore all errors/typos from the downtime parsing
      puts("Error loading downtime banner file: #{filename} - #{e}")
    end
  end
end
