class LensController < SwfController
  def index
    @body_id = 'lensBody'
    @minFlashVersion = '9.0.45'
    @lens = Lens.find(params[:id])

    @swf_url = swf_url('v3embed.swf')
  end
end
