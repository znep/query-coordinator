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
    elsif (params[:multi])
      #TODO: Need a method to get lenses by array of ids.
      # Justin working on a method to support this.
      # Meantime, get all blists and filter out the ones we want.
      args = Array.new
      multiParam = params[:multi]
      args = multiParam.split(';')
      @lenses = getLensesWithIds(args)
    elsif (params[:items])
      @item_count = params[:items]
    end
  end

private

  def get_blists(owner, shared_to, shared_by, type)
    # TODO: implement filters for tags

    opts = Hash.new
    if owner.nil? && shared_to.nil? && shared_by.nil? && type.nil? ||
      owner != @cur_user.id.to_s || type == 'filter'
      opts['includeFavorites'] = true
      opts['includeShared'] = true
    end
    if shared_to == @cur_user.id.to_s
      opts['includeShared'] = true
    end
    if shared_by != @cur_user.id.to_s
      opts['includeShared'] = true
    end
    if type == 'favorite'
      opts['includeFavorites'] = true
    end
    cur_lenses = Lens.find(opts)

    if !owner.nil?
      cur_lenses = cur_lenses.find_all {|l| l.ownerId.to_s == owner}
    end
    if !shared_to.nil?
      cur_lenses = cur_lenses.find_all do |l|
        l.permissions.any? do |p|
          p.isEnabled && !p.user.nil? && p.user.id.to_s == shared_to
        end
      end
    end
    if !shared_by.nil?
      cur_lenses = cur_lenses.find_all {|l| l.ownerId.to_s == shared_by &&
        l.is_shared?}
    end
    if type == 'filter'
      cur_lenses = cur_lenses.find_all {|l| !l.isDefault}
    end
    # TODO: implement filters for favorites


    # Sort by blist ID, sub-sort by isDefault to sort all blists just
    # before lenses
    cur_lenses.sort! do |a,b|
      if a.blistId < b.blistId
        -1
      elsif a.blistId > b.blistId
        1
      else
        a.isDefault && !b.isDefault ?
          -1 : !a.isDefault && b.isDefault ? 1 : 0
      end
    end
    return cur_lenses
  end

  def getLensesWithIds(params = nil)
    opts = Hash.new
    opts['includeShared'] = true
    opts['includeFavorites'] = true

    cur_lenses = Lens.find(opts)

    if !params.nil?
      cur_lenses = cur_lenses.find_all do |lens|
        params.any? { |p| p == lens.id.to_s }
      end
    end

    return cur_lenses
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
