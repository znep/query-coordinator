class CreateGettyImages < ActiveRecord::Migration
  def change
    create_table :getty_images do |t|
      t.string :getty_id, null: false
      t.integer :domain_id, null: false
      t.string :created_by, null: false

      t.belongs_to :document

      t.timestamps null: false
    end
  end
end
