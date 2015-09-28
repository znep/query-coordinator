module BlockOperations
  extend ActiveSupport::Concern

  included do

    def blocks
      story_blocks = Block.for_story(self)
      in_story_order(story_blocks)
    end

    def block_images
      story_blocks = Block.for_story(self).with_component_type('image')
      ordered_blocks = in_story_order(story_blocks).compact

      ordered_blocks.map do |block|
        block.components.
          select { |component| component['type'] == 'image'}.
          map { |component| component['value']['url'] }
      end.flatten
    end

    private

    # The order in which block rows are returned from the database is not
    # guaranteed to match the order in which the ids were supplied to the
    # select query, so we need to apply the story's ordering of the blocks
    # to the query result before returning it.
    #
    # We pass in blocks here because we want to be able to sort a filtered list of blocks
    # Chaining active record queries will not work here because of how we store the
    # order of blocks within block_ids in the story model.
    def in_story_order(blocks)
      self.block_ids.map do |block_id|
        blocks.detect { |block_object| block_object.id == block_id }
      end
    end

  end
end
