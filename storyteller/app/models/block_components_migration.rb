# Model used to keep an audit log of all activity related to migrating
# components within blocks
class BlockComponentsMigration < ActiveRecord::Base
  belongs_to :block

  def self.from_block(block)
    new(block: block, original_components: block.components)
  end
end
