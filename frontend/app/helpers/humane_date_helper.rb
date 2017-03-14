module HumaneDateHelper
  extend ActionView::Helpers::DateHelper

  def self.humane_date(epoch_secs)
    if epoch_secs.nil? || epoch_secs == 0
      return 'None'
    end
    other = Time.at(epoch_secs)
    token = Time.now > other ? 'ago' : 'from now'

    "#{time_ago_in_words(other)} #{token}"
  end
end
