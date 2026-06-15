import React, { useState, Children, useRef, useEffect } from 'react';

import { Tabs, Tab, Button } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import ArrowDropUpIcon from '@material-ui/icons/ArrowDropUp';

const useStyles = makeStyles(
  {
    root: {
      paddingLeft: 24,
      transition: 'height 300ms',
      paddingRight: 24,
      width: '100%',
      marginTop: 0,
      paddingTop: 6,
      height: props => (props.height ? props.height : 100),
      background: 'var(--panel)',
      borderTop: '1px solid var(--hairline)'
    },
    tabs: { display: 'inline-block' },
    tab: {},
    header: {
      display: 'inline-block',
      whiteSpace: 'nowrap'
    },
    tabactive: {},
    tabinactive: {},
    indicatoractive: {},
    indicatorinactive: {
      '& .MuiTabs-indicator': {
        display: 'none'
      }
    },
    view: {
      marginTop: 15,
      textAlign: 'left',
      display: 'block',
      width: '100%',
      maxWidth: '1000px',
      overflowY: 'scroll',
      overflowX: 'hidden',
      height: '100%',
      '&::-webkit-scrollbar': {
        display: 'none'
      }
    },
    viewcontainer: { height: '100%' }
  },
  { name: 'controls-wrapper' }
);

const ControlsWrapper = props => {
  /*
  accepts a 'tabcontent' with 'tag as a prop',
  maps out 'tabs' and associated views.
  */

  const childprops = Children.toArray(props.children).map(p => p.props);
  const classes = useStyles(props);
  const valtabobj = {};
  childprops.forEach(o => (valtabobj[o.tabname] = o.tag));
  const activetab = props.activetab;

  const container = useRef(null);

  return (
    <div ref={container} className={classes.root}>
      <div className={classes.header}>
        <div className={classes.tabs}>
          <Tabs
            value={activetab}
            indicatorColor="primary"
            textColor="primary"
            className={
              props.isVisible
                ? classes.indicatoractive
                : classes.indicatorinactive
            }
          >
            {childprops.map((t, i) => {
              return (
                <Tab
                  disableRipple={true}
                  key={i}
                  className={
                    activetab == t.tag
                      ? classes.tab + ' ' + classes.tabactive
                      : classes.tab + ' ' + classes.tabinactive
                  }
                  label={t.tabname}
                  value={t.tag}
                  onClick={() => props.tabChangeCallback(t.tag)}
                />
              );
            })}
          </Tabs>
        </div>
        {props.disableCollapse ? (
          ''
        ) : (
          <Button
            disableRipple={true}
            color="primary"
            onClick={() => props.toggleHideCallback()}
          >
            {props.isVisible ? <ArrowDropDownIcon /> : <ArrowDropUpIcon />}
          </Button>
        )}
      </div>
      <div className={classes.viewcontainer}>
        {childprops.map((t, i) => {
          return (
            <div
              key={i}
              className={classes.view}
              style={{
                display:
                  activetab === t.tag && props.isVisible
                    ? 'inline-block'
                    : 'none',
                overflow: 'hidden',
                whiteSpace: 'nowrap'
              }}
            >
              {Children.toArray(props.children)[i]}
            </div>
          );
        })}
      </div>

      <div />
    </div>
  );
};

export { ControlsWrapper };
