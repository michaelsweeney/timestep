import React, { useState, Children, useRef } from 'react';

import { Tabs, Tab } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(
  {
    root: {
      marginLeft: 75,
      marginRight: 75,
      marginTop: 10,
      width: '90%'
    },
    tabs: {},
    tab: {},
    view: {
      marginTop: 15,
      textAlign: 'left',
      display: 'block',
      width: '100%',
      maxWidth: '1000px',
      overflowY: 'scroll',
      overflowX: 'hidden',
      height: 200,
      '&::-webkit-scrollbar': {
        display: 'none'
      }
    }
  },
  { name: 'controls-wrapper' }
);

const ControlsWrapper = props => {
  /*
  accepts a 'tabcontent' with 'tag as a prop',
  maps out 'tabs' and associated views.
  */

  const childprops = Children.toArray(props.children).map(p => p.props);
  const classes = useStyles();
  const valtabobj = {};
  childprops.forEach(o => (valtabobj[o.tabname] = o.tag));
  const [value, setValue] = useState(childprops[0].tag);

  const handleTabChange = tag => {
    setValue(tag);
  };
  return (
    <div className={classes.root}>
      <Tabs
        className={classes.tabs}
        value={value}
        indicatorColor="primary"
        textColor="primary"
        // centered
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

export { ControlsWrapper };
