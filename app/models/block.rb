class Block < ActiveRecord::Base
  include Immutable

  # We assume a 12-column grid.
  # Given this assumption, these layouts correspond to (respectively):
  # 100%, 50%/50%, 66%/33%, 33%/66%, 33%/33%/33% and 25%/25%/25%/25%
  VALID_BLOCK_LAYOUTS = [
    '12',
    '6-6',
    '8-4',
    '4-8',
    '4-4-4',
    '3-3-3-3'
  ]

  validates :layout, presence: true, inclusion: { in: VALID_BLOCK_LAYOUTS }
  validates :components, presence: true
  validates :created_by, presence: true

  scope :for_story, ->(story) {
    # The order in which block rows are returned from the database is not
    # guaranteed to match the order in which the ids were supplied to the
    # select query, so we need to apply the story's ordering of the blocks
    # to the query result before returning it.
    block_objects = where(id: story.block_ids)
    ordered_block_objects = []

    story.block_ids.each do |block_id|
      ordered_block_objects << block_objects.detect { |block_object|
        block_object.id == block_id
      }
    end

    ordered_block_objects
  }

  def self.from_json(json_block)
    # TODO: Validate before returning or throw exception?
    Block.new(
      layout: json_block[:layout],
      components: json_block[:components],
      created_by: json_block[:created_by]
    )
  end
end
