module BlockOperations
  extend ActiveSupport::Concern

  included do

    def blocks
      Block.for_story(self)
    end

    def blocks_with_images
      blocks = Block.for_story(self)
      blocks.select do |block|
        block.components.any? do |component|
          component['type'] == 'image'
        end
      end
    end

    def block_images
      blocks = blocks_with_images
      images = blocks.map do |block|
        block.components.map do |component|
          component['value']['url']
        end
      end
      images.flatten
    end
  end
end
