import React, { useState, useEffect } from 'react';
import Select from '@material-ui/core/Select';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import ListSubheader from '@material-ui/core/ListSubheader';
import FormControl from '@material-ui/core/FormControl';

import * as d3 from 'd3';

// make new component
const colorcategories = {
  Category10: 'schemeCategory10',
  Accent: 'schemeAccent',
  Dark2: 'schemeDark2',
  Paired: 'schemePaired',
  Pastel1: 'schemePastel1',
  Pastel2: 'schemePastel2',
  Set1: 'schemeSet1',
  Set3: 'schemeSet3',
  Set2: 'schemeSet2',
  Tableau10: 'schemeTableau10'
};

const colorscales = {
  Diverging: 'divider',
  BrBG: 'interpolateBrBG',
  PRGn: 'interpolatePRGn',
  PiYG: 'interpolatePiYG',
  PuOr: 'interpolatePuOr',
  RdBu: 'interpolateRdBu',
  RdGy: 'interpolateRdGy',
  RdYlBu: 'interpolateRdYlBu',
  RdYlGn: 'interpolateRdYlGn',
  Spectral: 'interpolateSpectral',
  'Sequential-Multi': 'divider',
  BuGn: 'interpolateBuGn',
  BuPu: 'interpolateBuPu',
  GnBu: 'interpolateGnBu',
  OrRd: 'interpolateOrRd',
  PuBuGn: 'interpolatePuBuGn',
  PuBu: 'interpolatePuBu',
  PuRd: 'interpolatePuRd',
  RdPu: 'interpolateRdPu',
  YlGnBu: 'interpolateYlGnBu',
  YlGn: 'interpolateYlGn',
  YlOrBr: 'interpolateYlOrBr',
  YlOrRd: 'interpolateYlOrRd',
  'Sequential-Single': 'divider',
  Blues: 'interpolateBlues',
  Greens: 'interpolateGreens',
  Greys: 'interpolateGreys',
  Purples: 'interpolatePurples',
  Reds: 'interpolateReds',
  Oranges: 'interpolateOranges',
  Cividis: 'interpolateCividis',
  'Sequential-Custom': 'divider',
  CubehelixDefault: 'interpolateCubehelixDefault',
  Rainbow: 'interpolateRainbow',
  Warm: 'interpolateWarm',
  Cool: 'interpolateCool',
  Sinebow: 'interpolateSinebow',
  Turbo: 'interpolateTurbo',
  Viridis: 'interpolateViridis',
  Magma: 'interpolateMagma',
  Inferno: 'interpolateInferno',
  Plasma: 'interpolatePlasma'
};

const ColorScaleSelect = props => {
  const handleChange = e => [
    props.colorScaleCallback(colorscales[e.target.value])
  ];

  const id = Math.floor(Math.random() * 1e6);
  return (
    <FormControl>
      <InputLabel htmlFor={`grouped-select-${id}`}>Colorscale</InputLabel>
      <Select
        // variant="outlined"
        native
        // disableRipple={true}
        style={{ width: 200 }}
        onChange={handleChange}
        defaultValue="Viridis"
        id={`grouped-select-${id}`}
      >
        {Object.keys(colorscales).map(d => {
          if (colorscales[d] == 'divider') {
            return <optgroup key={d} label={d} />;
          } else {
            return <option key={d}>{d}</option>;
          }
        })}
      </Select>
    </FormControl>
  );
};

export { ColorScaleSelect };
