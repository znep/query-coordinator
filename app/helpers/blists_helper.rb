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

end
