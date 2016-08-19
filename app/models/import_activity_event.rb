class ImportActivityEvent
  include ActivityFeedHelper

  def initialize(data)
    @data = data
  end

  def ==(other)
    other.class == self.class && @data == other.data
  end

  def status
    status_to_snake(@data[:status])
  end

  def event_time
    Time.parse @data[:event_time]
  end

  def type
    @data[:event_type].gsub('-', '_')
  end

  def info
    @info ||= @data[:info].with_indifferent_access
  end

  protected

  attr_reader :data

end
