class AddCroppingToDocuments < ActiveRecord::Migration
  def change
    add_column :documents, :crop_x, :float
    add_column :documents, :crop_y, :float
    add_column :documents, :crop_width, :float
    add_column :documents, :crop_height, :float
  end
end
