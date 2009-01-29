class BlistsController < ApplicationController
  def index
    @bodyClass = 'home'
    args = Hash.new
    filterParam = params[:filter] || ''
    filters = filterParam.split(';')
    filters.each do |f|
      parts = f.split(':')
      if parts[1] == 'true'
        parts[1] = true
      elsif parts[1] == 'false'
        parts[1] = false
      end
      args[parts[0]] = parts[1]
    end
    @blists = getBlists(args)
  end

  def detail
    @id = params[:id]
  end

private

  def getBlists(params = nil)
    cur_blists = [
      { 'id' => 'ABC', 'favorite' => false, 'is_default' => true,
        'name' => 'A blist', 'description' => 'Some blist description',
        'owner' => 'Jeff', 'last_updated' => '1/20/09' },
      { 'id' => 'DEF', 'favorite' => true, 'is_default' => true,
        'name' => 'Some other blist', 'description' => 'Some blist description',
        'owner' => 'Jeff', 'last_updated' => '1/21/09' },
      { 'id' => 'GHI', 'favorite' => false, 'is_default' => false,
        'name' => 'Some lens', 'description' => 'Some lens description',
        'owner' => 'Chris', 'last_updated' => '1/22/09' },
    ]

    if !params.nil?
      params.each do |key, value|
        cur_blists = cur_blists.find_all { |b| b[key] == value }
      end
    end
    return cur_blists
  end
end
