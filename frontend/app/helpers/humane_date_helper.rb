module HumaneDateHelper
  extend ActionView::Helpers::DateHelper

  def self.humane_date(epoch_secs)
    if epoch_secs.nil? || epoch_secs == 0
      return I18n.t('common.none')
    end
    other = Time.at(epoch_secs)
    distance_in_words = time_ago_in_words(other)

    Time.now > other ?
      I18n.t('date.time_in_distance.ago', :distance => distance_in_words) :
      I18n.t('date.time_in_distance.from_now', :distance => distance_in_words)

  end
end
