class FixCreatedByInBlocks < ActiveRecord::Migration
  def up
    Block.all.each do |block|
      next if block.created_by =~ FOUR_BY_FOUR_PATTERN

      begin
        user_hash = eval(block.created_by)
        user_uid = user_hash['id']
        if user_uid.blank? || user_uid !~ FOUR_BY_FOUR_PATTERN
          puts "Skipping Block(id: #{block.id}) because user uid, '#{user_uid}' does not match four-by-four pattern..."
          next
        end

        block.update_column(:created_by, user_uid)
      rescue
        next
      end
    end
  end

  def down
    # Nothing to down
  end
end
