/* global fetch */
import React, {Component} from 'react';
import {render} from 'react-dom';
import {StaticMap} from 'react-map-gl';
import DeckGL, {ArcLayer, CompositeLayer, TextLayer, IconLayer} from 'deck.gl';
import MultiIconLayer from '@deck.gl/layers/src/text-layer/multi-icon-layer/multi-icon-layer';
import {createIterable} from '@deck.gl/core';

import GL from '@luma.gl/constants';
import {Model, Geometry, fp64} from '@luma.gl/core';

import myvs from './my-multiicon-layer-vertex.glsl';

// Set your mapbox token here
const MAPBOX_TOKEN = ''; // eslint-disable-line

// Extends MultiIconLayer to rewritre vshader and set text on the top of the arc
class MyMultiIconLayer extends MultiIconLayer {
  getShaders() {
    return Object.assign({}, super.getShaders(), {
      vs: myvs
    });
  }

  initializeState() {
    MultiIconLayer.prototype.initializeState.call(this);
    const attributeManager = this.getAttributeManager();

    /* eslint-disable max-len */
    attributeManager.addInstanced({
      instanceStartPosition: {
        size: 4,
        transition: true,
        accessor: 'getStartPosition',
      },
      instanceEndPosition: {
        size: 4,
        transition: true,
        accessor: 'getEndPosition',
      },
      instanceArcPosition: {
        size: 4,
        transition: true,
        accessor: 'getArcPosition',
        defaultValue: 1.0
      },
      instanceHeights: {
        size: 1,
        transition: true,
        accessor: 'getHeight',
        defaultValue: 1
      },
      instanceTilts: {
        size: 1,
        transition: true,
        accessor: 'getTilt',
        defaultValue: 0
      }
    });
  }
}
MyMultiIconLayer.layerName = 'MyMultiIconLayer';
MyMultiIconLayer.defaultProps = {
  getHeight: {type: 'accessor', value: 1},
  getStartPosition: d => d.source.coordinates,
  getEndPosition: d => d.target.coordinates,
  getArcPosition: d => 25.0,
  getHeight: {type: 'accessor', value: 1},
  getTilt: {type: 'accessor', value: 0}
};


class MyTextLayer extends TextLayer {

  // to custom sublayer MultiIconLayer
  renderLayers() {
    const {data, scale, iconAtlas, iconMapping} = this.state;

    const {
      getPosition,
      getColor,
      getSize,
      getAngle,
      getTextAnchor,
      getAlignmentBaseline,
      getPixelOffset,
      fp64,
      billboard,
      sdf,
      sizeScale,
      sizeUnits,
      sizeMinPixels,
      sizeMaxPixels,
      transitions,
      updateTriggers
    } = this.props;

    // Need to use modified IconLayer in TextLayer
    const SubLayerClass = this.getSubLayerClass('characters', MyMultiIconLayer);

    return new SubLayerClass(
      {
        sdf,
        iconAtlas,
        iconMapping,

        getPosition: d => getPosition(d.object),
        getStartPosition: d => d.object.source.coordinates,
        getEndPosition: d => d.object.target.coordinates,

        getColor: this._getAccessor(getColor),
        getSize: this._getAccessor(getSize),
        getAngle: this._getAccessor(getAngle),
        getAnchorX: this.getAnchorXFromTextAnchor(getTextAnchor),
        getAnchorY: this.getAnchorYFromAlignmentBaseline(getAlignmentBaseline),
        getPixelOffset: this._getAccessor(getPixelOffset),
        fp64,
        billboard,
        sizeScale: sizeScale * scale,
        sizeUnits,
        sizeMinPixels: sizeMinPixels * scale,
        sizeMaxPixels: sizeMaxPixels * scale,

        transitions: transitions && {
          getPosition: transitions.getPosition,
          getAngle: transitions.getAngle,
          getColor: transitions.getColor,
          getSize: transitions.getSize,
          getPixelOffset: updateTriggers.getPixelOffset
        }
      },
      this.getSubLayerProps({
        id: 'characters',
        updateTriggers: {
          getPosition: updateTriggers.getPosition,
          getAngle: updateTriggers.getAngle,
          getColor: updateTriggers.getColor,
          getSize: updateTriggers.getSize,
          getPixelOffset: updateTriggers.getPixelOffset,
          getAnchorX: updateTriggers.getTextAnchor,
          getAnchorY: updateTriggers.getAlignmentBaseline
        }
      }),
      {
        data,
        getIcon: d => d.text,
        getShiftInQueue: d => this.getLetterOffset(d),
        getLengthOfQueue: d => this.getTextLength(d)
      }
    );
  }
}
MyTextLayer.layerName = 'MyTextLayer';
MyTextLayer.defaultProps = {
  getStartPosition: d => d.source.coordinates,
  getEndPosition: d => d.target.coordinates
};

// Create composite layer
class ArcTextLayer extends CompositeLayer {
  renderLayers() {
    const {id, data, strokeWidth = 5} = this.props;

    return [
      new MyTextLayer({
        id: `${id}-text`,
        data: data,
        getPosition: d => d.source.coordinates,
        getText: d => d.label,
        getSize: 32,
        getAngle: 0,
        getTextAnchor: 'middle',
        getAlignmentBaseline: 'bottom',
        getStartPosition: d => d.source.coordinates,
        getEndPosition: d => d.target.coordinates,
        getColor: d => [0, 0, 0, 255]
      }),
      new ArcLayer({
        id: `${id}-arc`,
        data: data,
        getSourcePosition: d => d.source.coordinates,
        getTargetPosition: d => d.target.coordinates,
        getSourceColor: d => [16, 52, 166],
        getTargetColor: d => [0, 0, 0],
        getWidth: strokeWidth,
        getRandomValue: d => Math.random()
      })
    ]
  }
}
ArcTextLayer.layerName = 'ArcTextLayer';

export const INITIAL_VIEW_STATE = {
  longitude: -3.6354027,
  latitude: 48.2707216,
  zoom: 7.5,
  maxZoom: 15,
  pitch: 30,
  bearing: 80
};

/* eslint-disable react/no-deprecated */
export class App extends Component {
  constructor(props) {
    super(props);
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

    const arcs = [
      {"label": "Brest to Lannion", "source" :  cities.features[0].geometry, "target": cities.features[2].geometry},
      {"label": "Lannion to Rennes", "source" : cities.features[2].geometry, "target": cities.features[3].geometry},
      {"label": "Rennes to Brest", "source" : cities.features[3].geometry, "target": cities.features[0].geometry}
    ];

    this.state = {
      arcs: arcs
    };
  }

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
