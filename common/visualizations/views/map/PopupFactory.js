import mapboxgl from 'mapbox-gl';

const POPUP_TIP_OFFSET_FROM_ANCHOR = 10;

export default class PopupFactory {
  // Creates a mapbox gl popup using the given anchorSize and options.
  // Arguments:
  //    anchorSize  : Object containing the height and width of the anchor based on which to
  //                  position the popup. For example, for
  //                  { width: 10, height: 10}
  //    pixelAnchorY     : <number>. Horizontal Offset in pixels to be used for positioning.
  //    pixelAnchorY     : <number>. Vertical Offset in pixels to be used for positioning.
  static create(pixelAnchorX = 0, pixelAnchorY = 0) {
    const bottom = pixelAnchorY - POPUP_TIP_OFFSET_FROM_ANCHOR;
    const horizontalCenter = pixelAnchorX;
    const left = pixelAnchorX + POPUP_TIP_OFFSET_FROM_ANCHOR;
    const right = pixelAnchorX - POPUP_TIP_OFFSET_FROM_ANCHOR;
    const top = pixelAnchorY + POPUP_TIP_OFFSET_FROM_ANCHOR;
    const verticalCenter = pixelAnchorY;

    return new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: {
        'bottom': [horizontalCenter, bottom],
        'bottom-left': [horizontalCenter, bottom],
        'bottom-right': [horizontalCenter, bottom],
        'left': [left, verticalCenter],
        'right': [right, verticalCenter],
        'top': [horizontalCenter, top],
        'top-left': [horizontalCenter, top],
        'top-right': [horizontalCenter, top]
      }
    });
  }
}
