class DowntimeConfig < ExternalConfig
  def env
    Rails.env
  end

  def update!
    Rails.logger.info("Config Update [#{uniqId}] from #{filename}")
    @downtimes ||= []
    begin
      yaml = YAML.load_file(filename)
      if yaml
        @downtimes = [yaml[env]].flatten.compact.collect do |time|
          Downtime.new(time['message_start'], time['message_end'],
                       time['downtime_start'], time['downtime_end'])
        end
        Rails.logger.info("#{Time.now} - Downtimes loaded! #{@downtimes.inspect}")
      else

        Rails.logger.warn("#{Time.now} - Unable to load downtime banner file: #{filename}")
      end
    rescue StandardError => e
      # Ignore all errors/typos from the downtime parsing
      puts("#{Time.now} - Error loading downtime banner file: #{filename} - #{e}")
    end
  end

  attr_reader :downtimes
end
