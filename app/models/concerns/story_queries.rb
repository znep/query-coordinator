module StoryQueries
  extend ActiveSupport::Concern

  included do

    def self.from_four_by_four(four_by_four)
      self.where(four_by_four: four_by_four).order(created_at: :desc).first
    end

    def self.from_four_by_four_and_time(four_by_four, time_string)
      self.where(four_by_four: four_by_four, created_at: time_string).first
    end
  end
end
