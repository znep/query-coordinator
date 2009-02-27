module BlistsHelper
  
  def get_type_icon_class_for_lens(lens)
    icon_class = ""
    
    if lens.is_shared?
      icon_class = lens.owner.id == @cur_user.id ? "itemSharedOut" : "itemSharedIn"
    elsif lens.is_private?
      icon_class = lens.flag?("schemaPublic") ? "itemPrivateSchema" : "itemPrivate"
    else
      icon_class = "item"
    end
    
    lens.is_blist? ? icon_class + "Blist" : icon_class + "Filter"
  end

end
