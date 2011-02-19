class Downtime
  include ActionView::Helpers::TagHelper
  include ActionView::Helpers::TextHelper

  attr_accessor :start, :finish, :message

  def initialize(start, finish, message)
    @start = start
    @finish = finish
    @message = message

    if @start.is_a? String
      @start = DateTime.parse(@start)
    end
    if @finish.is_a? String
      @finish = DateTime.parse(@finish)
    end
  end

  def hash
    (@start || @finish).to_i
  end

  def should_display(current_time)
    @message.present? &&
      (@start.nil? || @start < current_time) &&
      (@finish.nil?  || @finish > current_time)
  end

  def html
    %Q{
    <div class="flash notice" id="maintenanceNotice">
      <a href="#" class="close"><span class="icon">close</span></a>
      #{simple_format(@message)}
    </div>}.html_safe
  end
end


