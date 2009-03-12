class BlistsController < SwfController
  helper_method :get_title

  def index
    @body_class = 'home'
    args = {'owner' => params[:owner],
            'owner_group' => params[:ownerGroup],
            'shared_to' => params[:sharedTo],
            'shared_to_group' => params[:sharedToGroup],
            'shared_by' => params[:sharedBy],
            'shared_by_group' => params[:sharedByGroup],
            'type' => params[:type],
            'untagged' => params[:untagged],
            'tag' => params[:tag]}
    @blists = get_blists(args)
    @title = get_title(args)
  end

  def show
    @body_id = 'lensBody'
    @lens = Lens.find(params[:id])

    @data_component = params[:dataComponent]

    @swf_url = swf_url('v3embed.swf')
  end

  def detail
    if (params[:id])
      @lens = Lens.find(params[:id])
    elsif (params[:multi])
      args = Array.new
      multiParam = params[:multi]
      args = multiParam.split(';')
      @lenses = get_lenses_with_ids(args)
    elsif (params[:items])
      @item_count = params[:items]
    end
  end

private

  def get_blists(params = nil)
    if params.nil?
      params = Hash.new
    end

    opts = Hash.new
    if !params['shared_to'].nil? && params['shared_to'] != @current_user.id
      opts['sharedTo'] = params['shared_to']
    end
    cur_lenses = Lens.find(opts)

    if !params['owner'].nil?
      cur_lenses = cur_lenses.find_all {|l| l.owner.id == params['owner']}
    end
    if !params['owner_group'].nil?
      group = Group.find(params['owner_group'])
      cur_lenses = cur_lenses.find_all {|l| group.users.any? {|u|
        u.id == l.owner.id}}
    end

    if !params['shared_to'].nil? && params['shared_to'] == @current_user.id
      cur_lenses = cur_lenses.find_all {|l|
        l.owner.id != params['shared_to'] && l.flag?('shared')}
    end
    if !params['shared_to_group'].nil?
      cur_lenses = cur_lenses.find_all {|l| l.grants.any? {|g|
        g.groupId == params['shared_to_group']}}
    end

    if !params['shared_by'].nil?
      cur_lenses = cur_lenses.find_all {|l|
        l.owner.id == params['shared_by'] && l.is_shared?}
    end
    if !params['shared_by_group'].nil?
      group = Group.find(params['shared_by_group'])
      cur_lenses = cur_lenses.find_all {|l| group.users.any? {|u|
        u.id == l.owner.id && l.flag?('shared')}}
    end

    if params['type'] == 'filter'
      cur_lenses = cur_lenses.find_all {|l| !l.flag?('default')}
    elsif params['type'] == 'favorite'
      cur_lenses = cur_lenses.find_all {|l| l.flag?('favorite')}
    end

    if !params['untagged'].nil? && params['untagged']
      cur_lenses = cur_lenses.find_all {|l| l.tags.length < 1}
    end
    if !params['tag'].nil?
      cur_lenses = cur_lenses.find_all {|l| l.tags.any? {|t|
        t.data == params['tag']}}
    end


    # Sort by blist ID, sub-sort by isDefault to sort all blists just
    # before lenses
    cur_lenses.sort! do |a,b|
      if a.blistId < b.blistId
        -1
      elsif a.blistId > b.blistId
        1
      else
        a.flag?('default') && !b.flag?('default') ?
          -1 : !a.flag?('default') && b.flag?('default') ? 1 : 0
      end
    end
    return cur_lenses
  end

  def get_lenses_with_ids(params = nil)
    cur_lenses = Lens.find_multiple(params)

    # Return this array in the order of the params so it'll match the DOM.
    hash_lenses = Hash.new
    cur_lenses.each do |l|
      hash_lenses[l.id] = l
    end

    ret_lenses = Array.new
    params.each do |p|
      ret_lenses << hash_lenses[p]
    end

    return ret_lenses
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

    if !params['untagged'].nil? && params['untagged']
      parts << 'with no tags'
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
