import React, { useState, useEffect } from 'react';
import { Select, InputLabel, FormControl } from '@material-ui/core';

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

const ColorCategorySelect = props => {
  const handleChange = e => [
    props.colorCategoryCallback(colorcategories[e.target.value])
  ];

  const id = Math.floor(Math.random() * 1e6);
  return (
    <FormControl>
      <InputLabel>Color Category</InputLabel>
      <Select
        native
        style={{ width: 200 }}
        onChange={handleChange}
        defaultValue="schemeCategory10"
        id={`grouped-select-${id}`}
      >
        {Object.keys(colorcategories).map(d => {
          if (colorcategories[d] == 'divider') {
            return <optgroup key={d} label={d} />;
          } else {
            return <option key={d}>{d}</option>;
          }
        })}
      </Select>
    </FormControl>
  );
};

export { ColorCategorySelect };
