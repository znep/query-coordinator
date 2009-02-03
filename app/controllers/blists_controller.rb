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
    return cur_lenses
  end
end
