# Enum of the possible rights that are available on a per-view basis.
module ViewRights

  # NOTE: This should reflect the Type enum from Core at
  # unobtainium/src/main/java/com/blist/models/views/Permission.java
  ALL_RIGHTS = %w{
    add
    add_column
    delete
    delete_view
    grant
    read
    remove_column
    update_column
    update_view
    write
  }

  ALL_RIGHTS.each do |right|
    const_set(right.upcase, right)
  end

  def self.to_h
    ALL_RIGHTS.reduce({}) { |acc, right| acc[right.upcase] = right ; acc }
  end
end
