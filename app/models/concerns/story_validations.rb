module StoryValidations
  extend ActiveSupport::Concern

  included do
    validates :uid, presence: true, format: FOUR_BY_FOUR_PATTERN
    # array is a built-in validator that checks each item in an array
    # against the specified requirements. is_array is our own validator
    # that simply verifies that the container is an array.
    validates :block_ids, is_array: true
    validates :created_by, presence: true
  end
end
