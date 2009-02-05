class BlistsController < ApplicationController
  def index
    # TODO: Get real use from login auth
    @cur_user = User.find('jeff11')
    @bodyClass = 'home'
    args = Hash.new
    filterParam = params[:filter] || ''
    filters = filterParam.split(';')
    filters.each do |f|
      parts = f.split(':')
      args[parts[0]] = parts[1]
    end
    @blists = getBlists(args)
  end

  def detail
    @id = params[:id]
  end

private

  def getBlists(params = nil)
    cur_lenses = @cur_user.lenses
    if !params.nil?
      params.each do |key, value|
        cur_lenses = cur_lenses.find_all { |b| b.send(key).to_s == value }
      end
    end
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
