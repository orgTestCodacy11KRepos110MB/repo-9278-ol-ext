/*	Copyright (c) 2017 Jean-Marc VIGLINO, 
  released under the CeCILL-B license (French BSD license)
  (http://www.cecill.info/licences/Licence_CeCILL-B_V1-en.txt).
*/

import ol_ext_inherits from '../util/ext'
import ol_filter_Base from './Base'

/** Make a map or layer look like made of a set of Lego bricks.
 *  @constructor
 * @requires ol_filter
 * @extends {ol_filter_Base}
 * @param {Object} [options]
 *  @param {string} [options.img]
 *  @param {number} [options.size] point size, default 30
 *  @param {null | string | undefined} [options.crossOrigin] crossOrigin attribute for loaded images.
 */
var ol_filter_Halftone = function(options) {
  if (!options) options = {};
  ol_filter_Base.call(this, options);
  this.internal_ = document.createElement('canvas');
  this.setSize(options.size);
  document.body.appendChild(this.internal_)
}
ol_ext_inherits(ol_filter_Halftone, ol_filter_Base);

/** Set the current size
*	@param {number} width the pattern width, default 30
*/
ol_filter_Halftone.prototype.setSize = function (size) {
  size = Number(size) || 30;
  this.set("size", size);
};

/** Postcompose operation
*/
ol_filter_Halftone.prototype.postcompose = function(e) {
  var ctx = e.context;
  var canvas = ctx.canvas;
  var ratio = e.frameState.pixelRatio;
  // ol v6+
  if (e.type === 'postrender') {
    ratio = 1;
  }

  ctx.save();
    // resize 
    var step = this.get('size')*ratio;
    var p = e.frameState.extent;
    var res = e.frameState.viewState.resolution/ratio;
    var offset = [ -Math.round((p[0]/res)%step), Math.round((p[1]/res)%step) ];
    var ctx2 = this.internal_.getContext("2d");
    var w = this.internal_.width = canvas.width;
    var h = this.internal_.height = canvas.height;

    // No smoothing please
    ctx2.webkitImageSmoothingEnabled =
    ctx2.mozImageSmoothingEnabled =
    ctx2.msImageSmoothingEnabled =
    ctx2.imageSmoothingEnabled = false;
    var w2 = Math.floor((w-offset[0])/step);
    var h2 = Math.floor((h-offset[1])/step);
    ctx2.drawImage (canvas, offset[0], offset[1], w2*step, h2*step, 0, 0, w2, h2);
    var data = ctx2.getImageData(0, 0, w2,h2).data;
    //
    ctx.webkitImageSmoothingEnabled =
    ctx.mozImageSmoothingEnabled =
    ctx.msImageSmoothingEnabled =
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage (this.internal_, 0,0, w2,h2, offset[0],offset[1], w2*step, h2*step);
    ctx.fillStyle = this.get('color') || '#000';
    // Draw tone
    ctx.clearRect (0, 0, w,h);  
    for (var x=0; x<w2; x++) for (var y=0; y<h2; y++) {
      var pix = ol_color_toHSL([data[x*4+y*w2*4], data[x*4+1+y*w2*4], data[x*4+2+y*w2*4]]);
      var l = (100-pix[2])/140;
      if (l) {
        ctx.beginPath();
        ctx.arc(offset[0]+step/2+x*step, offset[1]+step/2+y*step, step*l, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.fill();
      }
    }
  ctx.restore();
};

export default ol_filter_Halftone
