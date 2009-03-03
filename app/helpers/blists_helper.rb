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

  def contacts_filter_menu(href_prefix, href_group_prefix,
                           title_key, title_group_key, id)
    items = [{'text' => 'Me', 'href' => href_prefix + @cur_user.id.to_s,
              'title' => get_title({title_key => @cur_user.id.to_s})}]

    items << {'section_title' => 'Groups'}
    groups = Group.find(Hash.new).sort {|a,b| a.name <=> b.name}
    first_char = ''
    groups.each do |g|
      name_char = g.name.slice(0, 1).upcase
      if name_char != first_char
        first_char = name_char
        items << {'section_title' => first_char, 'class' => 'sortHeader'}
      end
      items << {'text' => g.name, 'href' => href_group_prefix + g.id.to_s,
          'title' => get_title({title_group_key => g.id.to_s})}
    end

    items << {'section_title' => 'Contacts'}
    contacts = Contact.find(Hash.new).sort {|a,b| a.displayName <=> b.displayName}
    first_char = ''
    contacts.each do |c|
      name_char = c.displayName.slice(0, 1).upcase
      if name_char != first_char
        first_char = name_char
        items << {'section_title' => first_char, 'class' => 'sortHeader'}
      end
      items << {'text' => c.displayName, 'href' => href_prefix + c.id.to_s,
          'title' => get_title({title_key => c.id.to_s})}
    end
    menu_tag('id' => id, 'class' => 'contactsMenu', 'items' => items)
  end
end
