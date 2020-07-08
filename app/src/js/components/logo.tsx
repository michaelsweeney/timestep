import React from 'react';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(
  {
    root: {
      position: 'relative',
      top: -10,
      paddingLeft: 10,
      paddingBottom: 0,
      textAlign: 'left'
    }
  },
  {
    name: 'logo'
  }
);

const Logo = () => {
  const classes = useStyles();
  return (
    <div className={`logo-div ${classes.root}`}>
      <svg
        scale="1.1"
        xmlns="http://www.w3.org/2000/svg"
        width="175"
        height="80"
        version="1.1"
        viewBox="0 0 70 70"
      >
        <text x="-30" y="50" fontFamily="Roboto" fontWeight="300" fontSize="30">
          timestep
        </text>
        <line
          x1="55"
          y1="55"
          x2="68"
          y2="55"
          strokeWidth="2"
          stroke="#FF0000"
        />
        <line
          x1="75"
          y1="55"
          x2="85"
          y2="55"
          strokeWidth="2"
          stroke="#FF0000"
        />
        <line
          x1="55"
          y1="29"
          x2="85"
          y2="29"
          strokeWidth="2"
          stroke="#FF0000"
        />
      </svg>
    </div>
  );
};

export { Logo };
