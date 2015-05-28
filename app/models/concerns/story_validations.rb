module StoryValidations
  extend ActiveSupport::Concern

  included do
    validates :four_by_four, presence: true, format: FOUR_BY_FOUR_PATTERN
    # array is a built-in validator that checks each item in an array
    # against the specified requirements. is_array is our own validator
    # that simply verifies that the container is an array.
    validates :blocks, is_array: true
    validates :created_by, presence: true
    validates :created_at, presence: true
  end
end
