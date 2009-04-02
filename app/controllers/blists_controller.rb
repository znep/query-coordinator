class BlistsController < SwfController
  helper_method :get_title

  def index
    @body_class = 'home'
    accept_keys = ['owner', 'owner_group', 'shared_to', 'shared_to_group',
      'shared_by', 'shared_by_group', 'type', 'untagged', 'tag']
    @args = params.reject {|k,v| !accept_keys.include?(k)}.inject({}) do |h,(k,v)|
      h[k] = CGI.unescape(v); h
    end
    @blists = get_blists(@args)
    @title = get_title(@args)
  end

  def show
    @body_id = 'lensBody'
    @body_class = 'home'
    case params[:id]
    when 'new_blist'
      # show new blist in swf
      @start_screen = 'new_blist'
    when 'import'
      # show import in swf
      @start_screen = 'import'
    else
      @view = View.find(params[:id])
    end

    @data_component = params[:dataComponent]
    @popup = params[:popup]

    @swf_url = swf_url('v3embed.swf')
  end

  def update
    blist_id = params[:id]
    
    # TODO: We need to update the whole view model.
    # Remove this once we can send only attributes that should be updated.
    update_blist = View.find(params[:id])
    params[:view][:name] = params[:view][:name] || update_blist.name
    params[:view][:description] = params[:view][:description] || update_blist.description
    params[:view][:category] = params[:view][:category] || update_blist.category
    params[:view][:tags] = !params[:view][:tags].nil? ? params[:view][:tags].split(',') : update_blist.data["tags"]
    # END: Remove this.

    blist = View.update_attributes!(blist_id, params[:view])

    respond_to do |format|
      format.html { redirect_to(blist_url(blist_id)) }
      format.data { render :json => blist.to_json() }
    end
  end

  def detail
    if (params[:id])
      @view = View.find(params[:id])
    elsif (params[:multi])
      args = Array.new
      multiParam = params[:multi]
      args = multiParam.split(':')
      @views = get_views_with_ids(args)
    elsif (params[:items])
      @item_count = params[:items]
    end
  end
  
  def create_favorite
    blist_id = params[:id]
    result = View.create_favorite(blist_id)
    
    respond_to do |format|
      format.html { redirect_to(blist_url(blist_id)) }
      format.data { render :text => "created" }
    end
  end
  
  def delete_favorite
    blist_id = params[:id]
    result = View.delete_favorite(blist_id)
    
    respond_to do |format|
      format.html { redirect_to(blist_url(blist_id)) }
      format.data { render :text => "deleted" }
    end
  end

private

  def get_blists(params = nil)
    if params.nil?
      params = Hash.new
    end

    opts = Hash.new
    if !params['shared_to'].nil? && params['shared_to'] != current_user.id
      opts['sharedTo'] = params['shared_to']
    end
    cur_views = View.find(opts)

    if !params['owner'].nil?
      cur_views = cur_views.find_all {|v| v.owner.id == params['owner']}
    end
    if !params['owner_group'].nil?
      group = Group.find(params['owner_group'])
      cur_views = cur_views.find_all {|v| group.users.any? {|u|
        u.id == v.owner.id}}
    end

    if !params['shared_to'].nil? && params['shared_to'] == current_user.id
      cur_views = cur_views.find_all {|v|
        v.owner.id != params['shared_to'] && v.flag?('shared')}
    end
    if !params['shared_to_group'].nil?
      cur_views = cur_views.find_all {|v| v.grants.any? {|g|
        g.groupId == params['shared_to_group']}}
    end

    if !params['shared_by'].nil?
      cur_views = cur_views.find_all {|v|
        v.owner.id == params['shared_by'] && v.is_shared?}
    end
    if !params['shared_by_group'].nil?
      group = Group.find(params['shared_by_group'])
      cur_views = cur_views.find_all {|v| group.users.any? {|u|
        u.id == v.owner.id && v.flag?('shared')}}
    end

    if params['type'] == 'filter'
      cur_views = cur_views.find_all {|v| !v.flag?('default')}
    elsif params['type'] == 'favorite'
      cur_views = cur_views.find_all {|v| v.flag?('favorite')}
    end

    if !params['untagged'].nil? && params['untagged'] == 'true'
      cur_views = cur_views.find_all {|v| v.tags.length < 1}
    end
    if !params['untagged'].nil? && params['untagged'] == 'false'
      cur_views = cur_views.find_all {|v| v.tags.length > 0}
    end
    if !params['tag'].nil?
      cur_views = cur_views.find_all {|v| v.tags.any? {|t|
        t.data == params['tag']}}
    end


    # Sort by blist ID, sub-sort by isDefault to sort all blists just
    # before views
    cur_views.sort! do |a,b|
      if a.blistId < b.blistId
        -1
      elsif a.blistId > b.blistId
        1
      else
        a.flag?('default') && !b.flag?('default') ?
          -1 : !a.flag?('default') && b.flag?('default') ? 1 : 0
      end
    end
    return cur_views
  end

  def get_views_with_ids(params = nil)
    cur_views = View.find_multiple(params)

    # Return this array in the order of the params so it'll match the DOM.
    hash_views = Hash.new
    cur_views.each do |v|
      hash_views[v.id] = v
    end

    ret_views = Array.new
    params.each do |p|
      ret_views << hash_views[p]
    end

    return ret_views
  end

  def get_name(user_id)
    return user_id == current_user.id ? 'me' : User.find(user_id).displayName
  end

  def get_title(params = nil)
    if params.nil?
      params = Hash.new
    end
    title = 'All '
    title_type = 'blists'

    parts = Array.new
    if !params['owner'].nil?
      parts << 'owned by ' + get_name(params['owner'])
    end
    if !params['owner_group'].nil?
      parts << 'owned by ' + Group.find(params['owner_group']).name
    end

    if !params['shared_to'].nil?
      parts << 'shared to ' + get_name(params['shared_to'])
    end
    if !params['shared_to_group'].nil?
      parts << 'shared to ' + Group.find(params['shared_to_group']).name
    end

    if !params['shared_by'].nil?
      parts << 'shared by ' + get_name(params['shared_by'])
    end
    if !params['shared_by_group'].nil?
      parts << 'shared by ' + Group.find(params['shared_by_group']).name
    end

    if !params['untagged'].nil? && params['untagged'] == 'true'
      parts << 'with no tags'
    end
    if !params['untagged'].nil? && params['untagged'] == 'false'
      parts << 'with any tags'
    end

    if !params['tag'].nil?
      parts << 'tagged "' + params['tag'] + '"'
    end

    if !params['type'].nil?
      title_type =
        case params['type']
        when 'favorite'
          'my favorite blists'
        when 'filter'
          'filters'
        end
    end

    title += "#{title_type} " + parts.join(' and ')
    return title
  end

end
