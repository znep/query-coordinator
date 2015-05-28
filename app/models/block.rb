class Block < ActiveRecord::Base

  # We assume a 12-column grid.
  # Given this assumption, these layouts correspond to (respectively):
  # 100%, 50%/50%, 66%/33%, 33%/66% and 25%/25%/25%/25%
  VALID_BLOCK_LAYOUTS = [
    '12',
    '6-6',
    '8-4',
    '4-8',
    '4-4-4-4'
  ]

  validates :layout, presence: true, inclusion: { in: VALID_BLOCK_LAYOUTS }
  validates :components, presence: true
  validates :created_by, presence: true
  validates :created_at, presence: true

  scope :for_story, ->(story) { where(id: story.blocks) }
end
