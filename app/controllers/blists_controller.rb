class BlistsController < SwfController
  def index
    # TODO: Get real use from login auth
    @cur_user = User.find('jeff11')
    @body_class = 'home'
    args = Hash.new
    @blists = getBlists(params[:owner], params[:sharedTo],
                        params[:sharedBy], params[:type])
  end

  def show
    @body_id = 'lensBody'
    @minFlashVersion = '9.0.45'
    # TODO: Get real use from login auth
    @cur_user = User.find('jeff11')
    @lens = Lens.find(params[:id])

    @swf_url = swf_url('v3embed.swf')
  end

  def detail
    @id = params[:id]
  end

private

  def getBlists(owner, shared_to, shared_by, type)
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
end
