class Downtime
  include ActionView::Helpers::TagHelper

  attr_accessor :message_start, :message_finish, :downtime_start, :downtime_finish

  def self.any? &block
    @@downtimes.any?(&block)
  end

  def self.map &block
    @@downtimes.map(&block)
  end

  def self.uncache!
    @@cache_expiry_time = Time.now
  end

  def self.needs_update?
    cached = defined?(@@cache_expiry_time) && @@cache_expiry_time > Time.now
    return false if cached
    @@cache_expiry_time = Time.now + 6.hours

    !defined?(@@last_updated) || File.stat(DOWNTIME[:file]).mtime > @@last_updated
  end

  def self.update!
    return unless needs_update?
    begin
      yaml = YAML.load_file(DOWNTIME[:file])[DOWNTIME[:env]]
      @@downtimes = [yaml].flatten.compact.collect do |time|
        Downtime.new(time['message_start'], time['message_end'],
                     time['downtime_start'], time['downtime_end'])
      end
    rescue StandardError
      # Ignore all errors/typos from the downtime parsing
      puts "ERROR Parsing Downtime Banner!"
      @@downtimes = []
    end
    @@last_updated = Time.now
  end

  def initialize(m_start, m_finish, d_start, d_finish)
    @message_start = m_start
    @message_finish = m_finish
    @downtime_start = d_start
    @downtime_finish = d_finish

    if @message_start.is_a? String
      @message_start = DateTime.parse(@message_start)
    end
    if @message_finish.is_a? String
      @message_finish = DateTime.parse(@message_finish)
    end
    if @downtime_start.is_a? String
      @downtime_start = DateTime.parse(@downtime_start)
    end
    if @downtime_finish.is_a? String
      @downtime_finish = DateTime.parse(@downtime_finish)
    end
  end

  def hash
    (@message_start || @message_finish).to_i
  end

  def should_display(current_time)
    @downtime_start.present? && @downtime_finish.present? &&
      (@message_start.nil? || @message_start < current_time) &&
      (@message_finish.nil?  || @message_finish > current_time)
  end

  def html(date_time)
    %Q{
    <div class="flash notice maintenanceNotice" data-hash="#{hash}" data-active="#{should_display(date_time)}">
      <a href="#" class="close"><span class="icon">close</span></a>
      #{I18n.t('core.maintenance_notice',
          :start => (%Q{<span class="dateLocalize" data-rawdatetime="#{@downtime_start.to_i}"></span>}),
          :finish => (%Q{<span class="dateLocalize" data-rawdatetime="#{@downtime_finish.to_i}"></span>})
        )}
    </div>}.html_safe
  end
end


