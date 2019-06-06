/* global fetch */
import React, {Component} from 'react';
import {render} from 'react-dom';
import {StaticMap} from 'react-map-gl';
import DeckGL, {ArcLayer, CompositeLayer, TextLayer} from 'deck.gl';

import GL from '@luma.gl/constants';
import {Model, Geometry, fp64} from '@luma.gl/core';

// I wanted to try to modify shader
import myvs from './my-arc-layer-vertex.glsl';
import myvs64 from './my-arc-layer-vertex-64.glsl';
import myfs from './my-arc-layer-fragment.glsl';

// Set your mapbox token here
const MAPBOX_TOKEN = ''; // eslint-disable-line

// Experiments custom Layer that extends ArcLayer
class MyArcLayer extends ArcLayer {

  // extends shader (vertex and fragment)
  getShaders() {
    console.log('getShaders', this.use64bitProjection());
    return this.use64bitProjection()
      ? {vs: myvs64, fs: myfs, modules: ['project64', 'picking']}
      : {vs: myvs, fs: myfs, modules: ['picking']}; // 'project' module added by default.
  }

  // add value that is passed to shader
  initializeState() {
    ArcLayer.prototype.initializeState.call(this);
    const attributeManager = this.getAttributeManager();
    /* eslint-disable max-len */
    attributeManager.addInstanced({
      randomValue: {
        size: 1,
        transition: true,
        accessor: 'getRandomValue',
        defaultValue: 1.0
      }
    });
  }

  // I played with the model
  _getModel(gl) {
    let positions = [];
    const NUM_SEGMENTS = 50;
    /*
     *  (0, -1)-------------_(1, -1)
     *       |          _,-"  |
     *       o      _,-"      o
     *       |  _,-"          |
     *   (0, 1)"-------------(1, 1)
     */

    // create triangles, aim is to have point to create the arc
    for (let i = 0; i < NUM_SEGMENTS; i++) {
        positions = positions.concat([i, -1, 0, i, 1, 0]);
    }

    // define model, with shaders and geometry (positions)
    const model = new Model(
      gl,
      Object.assign({}, this.getShaders(), {
        id: this.props.id,
        geometry: new Geometry({
          drawMode: GL.TRIANGLE_STRIP,
          attributes: {
            positions: new Float32Array(positions)
          }
        }),
        isInstanced: true,
        shaderCache: this.context.shaderCache
      })
    );

    model.setUniforms({numSegments: NUM_SEGMENTS});
    return model;
  }

}

// Experiments CompositeLayer
class ArcTextLayer extends CompositeLayer {

  // Main function, that list other Layers used
  renderLayers() {
    const {id, data, strokeWidth = 5} = this.props;
    console.log(data);

    return [
      new TextLayer({
        id: `${id}-text`,
        data: data,
        getPosition: d => d.source.coordinates,
        getText: d => d.label,
        getSize: 32,
        getAngle: 0,
        getTextAnchor: 'middle',
        getAlignmentBaseline: 'center'
      }),
      new MyArcLayer({
        id: `${id}-arc`,
        data: data,
        getSourcePosition: d => d.source.coordinates,
        getTargetPosition: d => d.target.coordinates,
        getSourceColor: d => [16, 52, 166],
        getTargetColor: d => [0, 0, 0],
        getWidth: strokeWidth,
        getRandomValue: d => Math.random()
      })/*,
      new ArcLayer({
        id: `${id}-arc2`,
        data: data,
        getSourcePosition: d => d.source.coordinates,
        getTargetPosition: d => d.target.coordinates,
        getSourceColor: d => [16, 52, 166],
        getTargetColor: d => [0, 0, 0],
        getWidth: strokeWidth,
        getRandomValue: d => Math.random()
      })*/
    ]
  }
}
ArcTextLayer.layerName = 'ArcTextLayer';

export const INITIAL_VIEW_STATE = {
  longitude: -3.6354027,
  latitude: 48.2707216,
  zoom: 8,
  maxZoom: 15,
  pitch: 30,
  bearing: 30
};

/* eslint-disable react/no-deprecated */
export class App extends Component {
  constructor(props) {
    super(props);

    // this is my basic data
    const cities = {
      "type": "custom",
      "name": "cities",
      "features": [
        { "name": "Brest", "geometry": { "type": "Point", "coordinates": [ -4.5347057, 48.4084027, 0 ] }},
        { "name": "Quimper", "geometry": { "type": "Point", "coordinates": [ -4.1674214, 47.9981062, 0 ] }},
        { "name": "Lannion", "geometry": { "type": "Point", "coordinates": [ -3.5048646, 48.7454127, 0 ] }},
        { "name": "Rennes", "geometry": { "type": "Point", "coordinates": [ -1.7235596, 48.1159102, 0 ] }}
      ]
    };

    // this is my "arc" data
    const arcs = [
      {"label": "Brest to Lannion", "source" :  cities.features[0].geometry, "target": cities.features[2].geometry},
      {"label": "Lannion to Rennes", "source" : cities.features[2].geometry, "target": cities.features[3].geometry},
      {"label": "Rennes to Brest", "source" : cities.features[3].geometry, "target": cities.features[0].geometry}
    ];

    // set the state
    this.state = {
      arcs: arcs
    };
  }

  // Call my custom layer (composite + arc modified Layers)
  _renderLayers() {
    return [
      new ArcTextLayer({
        id: 'ArcTextLayer',
        strokeWidth: 5,
        data: this.state.arcs
      })
    ];
  }

  render() {
    const {viewState, controller = true, baseMap = true} = this.props;

    return (
      <DeckGL
        layers={this._renderLayers()}
        initialViewState={INITIAL_VIEW_STATE}
        viewState={viewState}
        controller={controller}
      >
        {baseMap && (
          <StaticMap
            reuseMaps
            mapStyle="mapbox://styles/mapbox/light-v9"
            preventStyleDiffing={true}
            mapboxApiAccessToken={MAPBOX_TOKEN}
          />
        )}
      </DeckGL>
    );
  }
}

export function renderToDOM(container) {
  render(<App />, container);
}
