class AddPresentableToBlock < ActiveRecord::Migration
  def up
    add_column :blocks, :presentable, :boolean, :default => true
    Block.with_component_type('spacer', 'horizontalRule').update_all(presentable: false)
  end

  def down
    remove_column :blocks, :presentable
  end
end
