class Downtime
  include ActionView::Helpers::TagHelper

  attr_accessor :message_start, :message_finish, :downtime_start, :downtime_finish

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

  def html
    %Q{
    <div class="flash notice" id="maintenanceNotice">
      <a href="#" class="close"><span class="icon">close</span></a>
      #{I18n.t('core.maintenance_notice',
        :start => ('<span class="dateLocalize" data-rawdatetime="' + @downtime_start.to_i.to_s + '"></span>'),
        :finish => ('<span class="dateLocalize" data-rawdatetime="' + @downtime_finish.to_i.to_s + '"></span>'))}
    </div>}.html_safe
  end
end


