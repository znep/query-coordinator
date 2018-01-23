module StoryQueries
  extend ActiveSupport::Concern

  included do

    def self.find_by_uid(uid)
      self.where(uid: uid, deleted_at: nil).order(created_at: :desc).first
    end

    # TODO: If we ever start using this method again, add an order clause.
    def self.find_by_uid_and_digest(uid, digest)
      self.where(uid: uid, digest: digest, deleted_at: nil).first
    end

    def self.find_next(uid, created_at)
      self.where(uid: uid, deleted_at: nil).
        where('created_at > ?', created_at).
        order(created_at: :asc).
        first
    end

    def self.find_previous(uid, created_at)
      self.where(uid: uid, deleted_at: nil).
        where('created_at < ?', created_at).
        order(created_at: :desc).
        first
    end

    def next
      self.class.find_next(uid, created_at)
    end

    def previous
      self.class.find_previous(uid, created_at)
    end

    # This method will eventually be useful for restoring drafts to previous
    # versions, but for the moment we don't necessarily need it.
    # Note that we have not figured out why passing a Ruby Time object as the
    # time argument to the where clause does not seem to work... is it a
    # timezone mismatch between Rails (which appears to run in UTC) and the
    # database?
    # def self.from_uid_and_time(uid, time)
    #   self.where(uid: uid, created_at: time).first
    # end
  end
end
