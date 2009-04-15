class ContactsController < ApplicationController
  helper_method :get_title

  def index
    @body_class = 'home'
    accept_keys = ['share_direction', 'group', 'type', 'untagged', 'tag']
    @args = params.reject {|k,v| !accept_keys.include?(k)}.inject({}) do |h,(k,v)|
      h[k] = CGI.unescape(v); h
    end
    @contacts = get_contacts(@args)
    @title = get_title(@args)
  end

# def update
#   group_id = params[:id]
#   
#   # TODO: We need to update the whole group model.
#   # Remove this once we can send only attributes that should be updated.
#   update_group = Group.find(group_id)
#   params[:group][:name] = params[:group][:name] || update_group.name
#   params[:group][:description] = params[:group][:description] || update_group.description
#   # END: Remove this.
#
#   group = Group.update_attributes!(group_id, params[:group])
#
#   respond_to do |format|
#     format.html { redirect_to(contacts_url) }
#     format.data { render :json => group.to_json() }
#   end
# end

  def detail
    @item_count = params[:items]
    @type = params[:type]
  end

  def contact_detail
    @contact = User.find(params[:id])
    
    @contact_contributor_blists = get_contributor_blists_for_contacts(Array[@contact])
    @contact_viewer_blists = get_viewer_blists_for_contacts(Array[@contact])
    
    @contact_groups = get_groups_for_contact(@contact)
    @contact_shares = get_shares_for_contacts(Array[@contact])
    
    @shares_to_contact = get_shared_to_contacts(Array[@contact])
    @shares_by_contact = get_shared_by_contacts(Array[@contact])
    
    @contact_blists = View.find('userId' => @contact.id)
    @contact_templates = @contact_blists.find_all { |b| b.flag?("schemaPublic") }
  end

  def group_detail
    @group = Group.find(params[:id])
    
    @group_contributor_blists = get_contributor_blists_for_contacts(@group.users)
    @group_viewer_blists = get_viewer_blists_for_contacts(@group.users)
    
    @group_shares = get_shares_for_contacts(@group.users)
    @shares_to_group = get_shared_to_contacts(@group.users)
    @shares_by_group = get_shared_by_contacts(@group.users)
    
    @group_blists = get_blists_for_group(@group)
  end

  def multi_detail
    multi = params[:multi].split('|')
    contact_ids = Array.new
    group_ids = Array.new
    
    multi.each do |item|
      item_array = item.split(':')
      if (item_array[0] == "contact")
        contact_ids << item_array[1]
      elsif (item_array[0] == "group")
        group_ids << item_array[1]
      end
    end
    
    @contacts = get_contacts_with_ids(contact_ids)
    @groups = get_groups_with_ids(group_ids)
  end

private

  def get_contacts(params = nil)
    if params.nil?
      params = Hash.new
    end

    cur_groups = []
    if params['type'] == 'groups' || !params['untagged'].nil? || !params['tag'].nil?
      cur_groups = Group.find()
    end

    contacts_args = {}
    if !params['share_direction'].nil?
      case params['share_direction']
      when 'in'
        contacts_args['sharedToMe'] = 'true'
      when 'out'
        contacts_args['sharedToContact'] = 'true'
      end
    end

    cur_contacts = []
    if !params['group'].nil?
      group_obj = Group.find(params['group'])
      cur_contacts = group_obj.users.dup
    elsif params['type'].nil? || params['type'] == 'contacts' ||
      !params['untagged'].nil? || !params['tag'].nil? ||
      !params['share_direction'].nil?
      cur_contacts = Contact.find(contacts_args)
    end

    cur_contacts.concat(cur_groups)

    if !params['untagged'].nil? && params['untagged'] == 'true'
      cur_contacts = cur_contacts.find_all {|c| c.tags.nil? || c.tags.length < 1}
    end
    if !params['untagged'].nil? && params['untagged'] == 'false'
      cur_contacts = cur_contacts.find_all {|c| !c.tags.nil? && c.tags.length > 0}
    end
    if !params['tag'].nil?
      cur_contacts = cur_contacts.find_all {|c| !c.tags.nil? && c.tags.any? {|t|
        t.data == params['tag']}}
    end

    # Sort by name
    cur_contacts.sort! do |a,b|
      (a.name || a.displayName) <=> (b.name || b.displayName)
    end


    return cur_contacts
  end

  def get_groups_for_contact(contact)
    groups = Group.find()
    groups = groups.find_all { |g| 
      g.users.any? { |u| u.id == contact.id } 
    }
  end

  def get_contributor_blists_for_contacts(contacts)
    views = View.find()
    all_shares = views.find_all { |v|
      contacts.any? { |c| v.contributor_users.include?(c.id) }
    }
  end

  def get_viewer_blists_for_contacts(contacts)
    views = View.find()
    all_shares = views.find_all { |v| 
      contacts.any? { |c| v.viewer_users.include?(c.id) }
    }
  end

  # Get all shares for this contact.
  def get_shares_for_contacts(contacts)
    views = View.find()
    all_shares = views.find_all { |v| 
      contacts.any? { |c| 
        (v.owner.id == c.id && v.flag?('shared')) ||
        v.viewer_users.include?(c.id) ||
        v.contributor_users.include?(c.id)
      }
    }
  end
  
  # Views you have shared to the contact.
  def get_shared_to_contacts(contacts)
    views = View.find()
    all_shares = views.find_all { |v|
      contacts.any? { |c| 
        v.viewer_users.include?(c.id) ||
        v.contributor_users.include?(c.id)
      }
    }
  end
  
  # Views the given contact has shared with you.
  def get_shared_by_contacts(contacts)
    views = View.find()
    all_shares = views.find_all { |v|
      contacts.any? { |c| 
        (v.owner.id == c.id && v.flag?('shared'))
      }
    }
  end
  
  def get_blists_for_group(group)
    views = Array.new
    group.users.each do |user|
      views += View.find('userId' => user.id)
    end
    views
  end
  
  def get_contacts_with_ids(ids)
    contacts = Contact.find()
    these_contacts = contacts.find_all { |c|
      ids.include?(c.id)
    }
  end
  
  def get_groups_with_ids(ids)
    groups = Group.find()
    these_groups = groups.find_all { |g| 
      ids.include?(g.id)
    }
  end

  def group_name(group)
    Group.find(group).name
  end

  def get_title(params = nil)
    if params.nil?
      params = Hash.new
    end
    title = 'All '
    title_type = 'contacts'

    parts = Array.new
    if !params['group'].nil?
      parts << 'in ' + group_name(params['group'])
    end

    if !params['share_direction'].nil?
      parts <<
        case params['share_direction']
        when 'in'
          'who have shared with me'
        when 'out'
          'with whom I have shared'
        end
    end

    if !params['untagged'].nil? && params['untagged'] == 'true'
      title_type = 'contacts and groups'
      parts << 'with no tags'
    end

    if !params['untagged'].nil? && params['untagged'] == 'false'
      title_type = 'contacts and groups'
      parts << 'with any tags'
    end

    if !params['tag'].nil?
      title_type = 'contacts and groups'
      parts << 'tagged "' + params['tag'] + '"'
    end

    if !params['type'].nil?
      title_type =
        case params['type']
        when 'contacts'
          'contacts'
        when 'groups'
          'groups'
        end
    end

    title += "#{title_type} " + parts.join(' and ')
    return title
  end
end
