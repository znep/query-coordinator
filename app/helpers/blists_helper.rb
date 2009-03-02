module BlistsHelper

  def get_type_icon_class_for_lens(lens)
    icon_class = "itemType"
    icon_class += lens.is_blist? ? " typeBlist" : " typeFilter"

    if lens.is_shared?
      icon_class += lens.owner.id == @cur_user.id ? " sharedOut" : " sharedIn"
    elsif lens.is_private?
      icon_class += lens.flag?("schemaPublic") ? " privateSchema" : " private"
    end
    icon_class
  end

  def get_blist_tags
    lenses = Lens.find(Hash.new)

    tags = []
    lenses.each { |l| tags << l.tags.collect { |t| t.data } }
    tags.flatten.sort.uniq
  end
  
  # Used for the header icon in the info pane.
  def get_type_icon_header_class_for_lens(lens)
    icon_class = lens.is_blist? ? "typeBlist" : "typeFilter"
    
    if lens.is_private?
      icon_class += lens.flag?("schemaPublic") ? " privateSchema" : " private"
    end
    icon_class
  end
  
  def get_type_string_for_lens(lens)
    
    sharing_type = ""
    if lens.is_shared?
      sharing_type = lens.owner.id == @cur_user.id ? " shared out" : " shared in"
    end
    
    blist_type = lens.is_blist? ? "blist" : "filter"
    privacy_type = lens.is_private? ? "private" : ""
    
    out = "#{privacy_type} #{blist_type} #{sharing_type}"
  end
end
