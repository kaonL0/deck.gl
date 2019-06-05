/* global HTMLVideoElement */
import {Texture2D} from '@luma.gl/core';
import BitmapLayer, {DEFAULT_TEXTURE_PARAMETERS} from './bitmap-layer';

export default class VideoBitmapLayer extends BitmapLayer {
  draw(opts) {
    const {image} = this.props;
    const {bitmapTexture} = this.state;

    // Update video frame
    if (image instanceof HTMLVideoElement && image.readyState > HTMLVideoElement.HAVE_METADATA) {
      bitmapTexture.resize({width: image.videoWidth, height: image.videoHeight});
      bitmapTexture.setSubImageData({data: image});
    }

    super.draw(opts);
  }

  loadTexture(image) {
    super.loadTexture(image);

    if (image instanceof HTMLVideoElement) {
      const {gl} = this.context;

      // Initialize an empty texture while we wait for the video to load
      this.setState({
        bitmapTexture: new Texture2D(gl, {
          width: 1,
          height: 1,
          parameters: DEFAULT_TEXTURE_PARAMETERS,
          mipmaps: false
        })
      });
    }
  }
}

VideoBitmapLayer.layerName = 'VideoBitmapLayer';
