module BlockOperations
  extend ActiveSupport::Concern

  included do

    def blocks
      story_blocks = Block.for_story(self)
      in_story_order(story_blocks)
    end

    # Returns a list of urls for all images in all blocks of the story in order or appearance.
    def block_images(size = nil)
      @block_images ||= begin
        # We don't want to include author blocks in this list
        image_compontent_types = %w( image hero )

        image_blocks = Block.for_story(self).with_component_type(*image_compontent_types)
        ordered_blocks = in_story_order(image_blocks).compact

        ordered_blocks.map do |block|
          block.components.
            select { |component| image_compontent_types.include?(component['type']) }.
            map { |component| ImageComponent.new(component).url(size) }
        end.flatten
      end
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
