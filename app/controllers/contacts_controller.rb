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

#  def update
#    blist_id = params[:id]
#
#    blist = View.update_attributes!(blist_id, params[:view])
#
#    respond_to do |format|
#      format.html { redirect_to(blist_url(blist_id)) }
#      format.data { render :json => blist.to_json() }
#    end
#  end

#  def detail
#    if (params[:id])
#      @view = View.find(params[:id])
#    elsif (params[:multi])
#      args = Array.new
#      multiParam = params[:multi]
#      args = multiParam.split(':')
#      @views = get_views_with_ids(args)
#    elsif (params[:items])
#      @item_count = params[:items]
#    end
#  end

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

    # Sort by name or displayName, depending on the object
    cur_contacts.sort! do |a,b|
      (a.name || a.displayName) <=> (b.name || b.displayName)
    end

    return cur_contacts
  end

#  def get_views_with_ids(params = nil)
#    cur_views = View.find_multiple(params)
#
#    # Return this array in the order of the params so it'll match the DOM.
#    hash_views = Hash.new
#    cur_views.each do |v|
#      hash_views[v.id] = v
#    end
#
#    ret_views = Array.new
#    params.each do |p|
#      ret_views << hash_views[p]
#    end
#
#    return ret_views
#  end

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
