module StoryQueries
  extend ActiveSupport::Concern

  included do

    def self.from_four_by_four(four_by_four)
      self.where(four_by_four: four_by_four).order(created_at: :desc).first
    end

    # This method will eventually be useful for restoring drafts to previous
    # versions, but for the moment we don't necessarily need it.
    # Note that we have not figured out why passing a Ruby Time object as the
    # time argument to the where clause does not seem to work... is it a
    # timezone mismatch between Rails (which appears to run in UTC) and the
    # database?
    # def self.from_four_by_four_and_time(four_by_four, time)
    #   self.where(four_by_four: four_by_four, created_at: time).first
    # end
  end
end
