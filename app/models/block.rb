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

  scope :for_story, ->(story) do
    where(id: story.block_ids)
  end

  # Searches the json blog for components with the specified type and only returns those blocks
  scope :with_component_type, ->(component_type) do
    json_query = %Q{ [{"type": "#{component_type}"}] }
    where("components @> ?", json_query)
  end

  def self.for_story_in_order(story)
    # The order in which block rows are returned from the database is not
    # guaranteed to match the order in which the ids were supplied to the
    # select query, so we need to apply the story's ordering of the blocks
    # to the query result before returning it.
    block_objects = Block.for_story(story)
    self.in_story_order(block_objects, story)
  end

  def as_json(options = nil)
    block_as_hash = self.attributes
    block_as_hash['id'] = block_as_hash['id'].to_s
    block_as_hash
  end

  def self.from_json(json_block)
    Block.new(
      layout: json_block[:layout],
      components: json_block[:components],
      created_by: json_block[:created_by]
    )
  end

  # We pass in blocks here because we want to be able to sort a filtered list of blocks
  # Chaining active record queries will not work here because of how we store the
  # order of blocks within block_ids in the story model.
  def self.in_story_order(blocks, story)
    story.block_ids.map do |block_id|
      blocks.detect { |block_object| block_object.id == block_id }
    end
  end
end
