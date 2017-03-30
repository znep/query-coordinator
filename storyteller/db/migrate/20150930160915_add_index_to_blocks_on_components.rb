class AddIndexToBlocksOnComponents < ActiveRecord::Migration
  def up
    execute 'CREATE INDEX index_blocks_on_components ON blocks USING gin (components jsonb_path_ops)'
  end

  def down
    execute 'DROP INDEX index_blocks_on_components'
  end
end
