import React, { useState, Children, useRef, useEffect } from 'react';

import { Tabs, Tab, Button } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import ArrowDropUpIcon from '@material-ui/icons/ArrowDropUp';

// Flat control strip. The MUI Tabs/Tab stay (they drive the tab callbacks) but
// are restyled flat: no Material slider indicator, uppercase Roboto labels (the
// original timestep tab style, not the technical mono), an accent underline +
// accent text on the active tab.
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
    tabs: {
      display: 'inline-block',
      // kill the Material sliding indicator; we draw our own underline per-tab
      '& .MuiTabs-indicator': { display: 'none' },
      '& .MuiTabs-flexContainer': { gap: 4 }
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      whiteSpace: 'nowrap'
    },
    tab: {
      minWidth: 0,
      minHeight: 0,
      padding: '7px 10px',
      fontFamily: 'var(--sans) !important',
      fontWeight: 500,
      fontSize: '12px !important',
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      borderBottom: '2px solid transparent',
      transition: 'color .12s, border-color .12s',
      opacity: 1
    },
    tabactive: {
      color: 'var(--accent) !important',
      borderBottomColor: 'var(--accent)'
    },
    tabinactive: {
      color: 'var(--ink-dim) !important',
      '&:hover': { color: 'var(--ink) !important' }
    },
    collapseBtn: {
      minWidth: 0,
      padding: '4px 6px',
      color: 'var(--ink-dim) !important',
      '&:hover': { color: 'var(--ink) !important', background: 'transparent' }
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
        <Tabs value={activetab} className={classes.tabs}>
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
        {props.disableCollapse ? (
          ''
        ) : (
          <Button
            disableRipple={true}
            className={classes.collapseBtn}
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
