import React from 'react';

import { Button } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import connect from '../store/connect';

const useStyles = makeStyles(
  {
    root: {
      boxSizing: 'border-box',
      display: 'inline-block',
      overflow: 'hidden',
      whiteSpace: 'nowrap'
    },

    container: {
      display: 'inline-block'
    },

    tabactive: {
      paddingLeft: '5 !important',
      paddingRight: '5 !important',
      marginLeft: '5 !important',
      marginRight: '5 !important',
      display: 'inline-block',
      color: 'white !important',
      backgroundColor: 'rgba(63, 81, 181, 1) !important',
      transition: 'all 250ms !important'
    },

    tabinactive: {
      paddingLeft: '5 !important',
      paddingRight: '5 !important',
      marginLeft: '5 !important',
      marginRight: '5 !important',
      display: 'inline-block',
      color: 'rgba(63, 81, 181, 1) !important',
      backgroundColor: 'white !important',
      transition: 'all 250ms !important',
      '&:hover': {
        backgroundColor: 'rgba(63, 81, 181, 0.05)  !important'
      }
    },
    removebtn: {
      paddingLeft: 10,
      '&:hover': {}
    }
  },

  { name: 'view-manager' }
);

const ViewSelector = props => {
  const classes = useStyles();

  const maxViews = 3;

  const { views, activeViewID } = props;

  const handleActiveViewChange = id => {
    props.actions.setActiveView(id);
  };

  const handleAddView = () => {
    const nextViewID = Math.max(...Object.values(views).map(e => e.viewID)) + 1;
    props.actions.addView(nextViewID);
    props.actions.setActiveView(nextViewID);
  };

  const handleRemoveView = id => {
    props.actions.removeView(id);
  };

  const AddButtonMarkup = () => {
    if (Object.values(views).length < maxViews) {
      return (
        <Button
          className={classes.tabinactive}
          disableRipple={true}
          onClick={handleAddView}
        >
          +
        </Button>
      );
    } else {
      return <span></span>;
    }
  };

  return (
    <div className={classes.root}>
      {Object.values(views).map((el, i) => {
        return (
          <div className={classes.container} key={i}>
            <Button
              disableRipple={true}
              className={
                activeViewID == el.viewID
                  ? classes.tabactive
                  : classes.tabinactive
              }
              color="primary"
              value={el.viewID}
              label={el.viewID}
            >
              <span onClick={() => handleActiveViewChange(el.viewID)}>
                {'View ' + el.viewID}
              </span>
              <span
                className={classes.removebtn}
                onClick={() => handleRemoveView(el.viewID)}
              >
                {el.viewID == 1 ? '' : 'X'}
              </span>
            </Button>
          </div>
        );
      })}
      <AddButtonMarkup />
    </div>
  );
};

const mapStateToProps = state => {
  return {
    activeViewID: state.session.activeViewID,
    views: state.views
  };
};

export default connect(mapStateToProps)(ViewSelector);
