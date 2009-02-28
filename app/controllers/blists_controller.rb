class BlistsController < SwfController
  helper_method :get_title

  def index
    # TODO: Get real use from login auth
    @body_class = 'home'
    args = Hash.new
    @blists = get_blists(params[:owner], params[:sharedTo],
                        params[:sharedBy], params[:type])
    @title = get_title(params[:owner], params[:sharedTo],
                        params[:sharedBy], params[:type])
  end

  def show
    @body_id = 'lensBody'
    @minFlashVersion = '9.0.45'
    # TODO: Get real use from login auth
    @lens = Lens.find(params[:id])

    @swf_url = swf_url('v3embed.swf')
  end

  def detail
    if (params[:id])
      @lens = Lens.find(params[:id])
      
      # TODO: We need a query to get all filters for a given blist.
      # For now, let's go back out and get the list of all blists,
      # grab all of them with this blist id, and filter out the default one.
      @filters = Lens.find({"blist" => params[:id]})
      # Once the filter thing works, remove the following code.
      @filters.delete_if do |b|
        b.blistId.to_s != params[:id] || ( b.flag?("default"))
      end
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

  def get_blists(owner = nil, shared_to = nil, shared_by = nil, type = nil)
    # TODO: implement filters for tags

    opts = Hash.new
    if !shared_to.nil? && shared_to != @cur_user.id.to_s
      opts['sharedTo'] = shared_to
    end
    cur_lenses = Lens.find(opts)

    if !owner.nil?
      cur_lenses = cur_lenses.find_all {|l| l.owner.id.to_s == owner}
    end
    if !shared_to.nil? && shared_to == @cur_user.id.to_s
      cur_lenses = cur_lenses.find_all {|l| l.owner.id.to_s != owner &&
        l.flag?('shared')}
    end
    if !shared_by.nil?
      cur_lenses = cur_lenses.find_all {|l| l.owner.id.to_s == shared_by &&
        l.is_shared?}
    end
    if type == 'filter'
      cur_lenses = cur_lenses.find_all {|l| !l.flag?('default')}
    elsif type == 'favorite'
      cur_lenses = cur_lenses.find_all {|l| l.flag?('favorite')}
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
    cur_lenses = Lens.find({ "ids" => params })
    
    # Return this array in the order of the params so it'll match the DOM.
    hash_lenses = Hash.new
    cur_lenses.each do |l|
      hash_lenses[l.id.to_s] = l
    end
    
    ret_lenses = Array.new
    params.each do |p|
      ret_lenses << hash_lenses[p]
    end
    
    return ret_lenses
  end

  def get_name(user_id)
    return user_id == @cur_user.id.to_s ? 'me' : User.find(user_id).displayName
  end

  def get_title(owner = nil, shared_to = nil, shared_by = nil, type = nil)
    title = 'All '
    if owner.nil? && shared_to.nil? && shared_by.nil? && type.nil?
      title += 'blists'
    end

    parts = Array.new
    if !owner.nil?
      parts << 'blists owned by ' + get_name(owner)
    end

    if !shared_to.nil?
      parts << 'blists shared to ' + get_name(shared_to)
    end

    if !shared_by.nil?
      parts << 'blists shared by ' + get_name(shared_by)
    end

    if !type.nil?
      parts << 'my ' +
        case type
        when 'favorite'
          'favorite blists'
        when 'filter'
          'filters'
        end
    end

    title += parts.join(' and ')
    return title
  end
end
