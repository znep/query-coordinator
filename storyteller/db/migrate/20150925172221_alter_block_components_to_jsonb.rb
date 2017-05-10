class AlterBlockComponentsToJsonb < ActiveRecord::Migration
  def up
    change_column :blocks, :components, 'jsonb USING CAST(components AS jsonb)'
  end

  def down
    change_column :blocks, :components, 'json USING CAST(components AS json)'
  end
end
