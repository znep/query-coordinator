class Downtime

  def self.map &block
    ExternalConfig.for(:downtime).map(&block)
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

  def to_json
    {
      display_start: @message_start.to_i,
      display_finish: @message_finish.to_i,
      message: I18n.t(
        'core.maintenance_notice',
        start: (%Q{<span class="dateLocalize" data-rawdatetime="#{@downtime_start.to_i}"></span>}),
        finish: (%Q{<span class="dateLocalize" data-rawdatetime="#{@downtime_finish.to_i}"></span>})
      )
    }.to_json
  end
end
