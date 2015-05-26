module StoryValidations
  extend ActiveSupport::Concern

  included do
    validates :four_by_four, presence: true, format: /\w{4}\-\w{4}/
    validates :blocks, empty_array: true
    validates :created_by, presence: true
    validates :created_at, presence: true
  end
end
