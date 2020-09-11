import React from 'react';

import { Button } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import connect from '../store/connect';

const useStyles = makeStyles(
  {
    root: {
      boxSizing: 'border-box'
    },

    tabactive: {
      display: 'block',
      color: 'white !important',
      backgroundColor: '#3f51b5 !important',
      transition: 'all 250ms !important'
    },

    tabinactive: {
      display: 'block',
      color: '#3f51b5 !important',
      backgroundColor: 'white !important',
      transition: 'all 250ms !important'
    },
    group: {}
  },

  { name: 'view-manager' }
);

const ViewSelector = props => {
  const classes = useStyles();

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

  return (
    <div className={classes.root}>
      {Object.values(views).map((el, i) => {
        return (
          <div key={i}>
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
              <span onClick={() => handleRemoveView(el.viewID)}>
                {el.viewID == 1 ? '' : 'X'}
              </span>
            </Button>
          </div>
        );
      })}
      <Button disableRipple={true} onClick={handleAddView}>
        +
      </Button>
      {/* </ButtonGroup> */}
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
