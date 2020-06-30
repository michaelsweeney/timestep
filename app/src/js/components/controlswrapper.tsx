import React, { useState, Children, useRef } from 'react';

import { Tabs, Tab } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(
  {
    root: {},
    tabs: {},
    tab: {},
    view: {}
  },
  { name: 'tab-wrapper' }
);

const ControlsWrapper = props => {
  // accepts a 'tabcontent' with 'tag as a prop',
  // maps out 'tabs' and associated views.

  const childprops = Children.toArray(props.children).map(p => p.props);
  const classes = useStyles();
  const valtabobj = {};
  console.log(Children.toArray(props.children));
  childprops.forEach(o => (valtabobj[o.tabname] = o.tag));
  const [value, setValue] = useState(childprops[0].tag);

  const handleTabChange = tag => {
    setValue(tag);
  };
  return (
    <div>
      <Tabs
        className={classes.tabs}
        value={value}
        indicatorColor="primary"
        textColor="primary"
      >
        {childprops.map((t, i) => {
          return (
            <Tab
              disableRipple={true}
              key={i}
              className={classes.tab}
              label={t.tabname}
              value={t.tag}
              onClick={() => handleTabChange(t.tag)}
            />
          );
        })}
      </Tabs>
      {childprops.map((t, i) => {
        return (
          <div
            key={i}
            className={classes.view}
            style={{ display: value === t.tag ? 'inline-block' : 'none' }}
          >
            {Children.toArray(props.children)[i]}
          </div>
        );
      })}
      <div />
    </div>
  );
};

const ControlsContent = props => {
  const inputEl = useRef(null);
  return <div ref={inputEl}>{props.children}</div>;
};

export { ControlsWrapper, ControlsContent };
