<p class="badges">
  <img src="https://img.shields.io/badge/@deck.gl/layers-lightgrey.svg?style=flat-square" alt="@deck.gl/layers" />
  <img src="https://img.shields.io/badge/fp64-yes-blue.svg?style=flat-square" alt="64-bit" />
</p>

# VideoBitmapLayer

The VideoBitmapLayer renders a video. 

```js
import DeckGL from 'deck.gl';
import {COORDINATE_SYSTEM} from '@deck.gl/core';
import {VideoBitmapLayer} from '@deck.gl/layers';

const DATA_URL = 'https://raw.githubusercontent.com/uber-common/deck.gl-data/master/examples/ascii/Felix_BoldKingCole.mp4';

const App = ({data, viewport}) => {
  const layer = new VideoBitmapLayer({
    coordinateSystem: COORDINATE_SYSTEM.IDENTITY,
    image: this._videoRef,
    bounds: [-400, -300, 400, 300]
  });

  return (
    <div>
      <DeckGL 
        layers={[layer]}
        initialViewState={{
          target: [0, 0, 0],
          zoom: 0
        }}
        views={new OrthographicView({})}
        controller={true}
        // force deck to redraw on every frame
        _animate={true}
      />
      <video
        ref={_ => this._videoRef = _}
        style = {{
          width: '800px',
          height: '600px'
        }}
        id="video"
        controls
        crossOrigin="anonymouse"
      >
        <source src={DATA_URL}/>
      </video>
    </div>
  );
}
```

## Installation

To install the dependencies from NPM:

```bash
npm install deck.gl
# or
npm install @deck.gl/core @deck.gl/layers
```

```js
import {VideoBitmapLayer} from '@deck.gl/layers';
new VideoBitmapLayer({});
```

To use pre-bundled scripts:

```html
<script src="https://unpkg.com/@deck.gl@~7.0.0/dist.min.js"></script>
<!-- or -->
<script src="https://unpkg.com/@deck.gl/core@~7.0.0/dist.min.js"></script>
<script src="https://unpkg.com/@deck.gl/layers@~7.0.0/dist.min.js"></script>
```

```js
new deck.VideoBitmapLayer({});
```


## Properties

Inherits from all [Bitmap Layer](/docs/layers/bitmap-layer.md) and [Base Layer](/docs/api-reference/layer.md) properties.

### Data

##### `bitmap` (HTMLVideoElement)

- Default `null`.

## Source
[modules/layers/src/video-bitmap-layer](https://github.com/uber/deck.gl/tree/master/modules/layers/src/video-bitmap-layer)
