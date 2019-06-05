import React, {Component} from 'react';
import {render} from 'react-dom';
import DeckGL from '@deck.gl/react';
import {OrthographicView, COORDINATE_SYSTEM} from '@deck.gl/core';
import {VideoBitmapLayer} from '@deck.gl/layers';

const DATA_URL =
  'https://raw.githubusercontent.com/uber-common/deck.gl-data/master/examples/ascii/Felix_BoldKingCole.mp4';

const INITIAL_VIEW_STATE = {
  target: [0, 0, 0],
  zoom: 0
};

export class App extends Component {
  _renderLayers() {
    return [
      new VideoBitmapLayer({
        coordinateSystem: COORDINATE_SYSTEM.IDENTITY,
        image: this._videoRef,
        bounds: [-400, -300, 400, 300]
      })
    ];
  }

  _renderVideo() {
    return (
      <video
        ref={_ => (this._videoRef = _)}
        style={{
          width: '800px',
          height: '600px'
        }}
        id="video"
        controls
        crossOrigin="anonymouse"
      >
        <source src={DATA_URL} />
      </video>
    );
  }

  render() {
    return (
      <div>
        <DeckGL
          layers={this._renderLayers()}
          initialViewState={INITIAL_VIEW_STATE}
          views={new OrthographicView({})}
          controller={true}
          // force deck to redraw on every frame
          _animate={true}
        />
        {this._renderVideo()}
      </div>
    );
  }
}

export function renderToDOM(container) {
  render(<App />, container);
}
