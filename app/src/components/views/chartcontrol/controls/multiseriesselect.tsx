import React from 'react';
import PropTypes from 'prop-types';
import { TextField, useMediaQuery, ListSubheader } from '@material-ui/core';
import Autocomplete from '@material-ui/lab/Autocomplete';
import { useTheme, makeStyles } from '@material-ui/core/styles';
import { VariableSizeList } from 'react-window';
import Typography from '@material-ui/core/Typography';

const LISTBOX_PADDING = 8;

function renderRow(props) {
  const { data, index, style } = props;
  return React.cloneElement(data[index], {
    style: {
      ...style,
      top: style.top + LISTBOX_PADDING
    }
  });
}

const OuterElementContext = React.createContext({});

const OuterElementType = React.forwardRef((props, ref) => {
  const outerProps = React.useContext(OuterElementContext);
  return <div ref={ref} {...props} {...outerProps} />;
});

function useResetCache(data) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (ref.current != null) {
      ref.current.resetAfterIndex(0, true);
    }
  }, [data]);
  return ref;
}

// Adapter for react-window
const ListboxComponent = React.forwardRef(function ListboxComponent(
  props,
  ref
) {
  const { children, ...other } = props;
  const itemData = React.Children.toArray(children);
  const theme = useTheme();
  const smUp = useMediaQuery(theme.breakpoints.up('sm'), { noSsr: true });
  const itemCount = itemData.length;
  const itemSize = smUp ? 36 : 48;

  const getChildSize = child => {
    if (React.isValidElement(child) && child.type === ListSubheader) {
      return 48;
    }

    return itemSize;
  };

  const getHeight = () => {
    if (itemCount > 8) {
      return 8 * itemSize;
    }
    return itemData.map(getChildSize).reduce((a, b) => a + b, 0);
  };

  const gridRef = useResetCache(itemCount);

  return (
    <div ref={ref}>
      <OuterElementContext.Provider value={other}>
        <VariableSizeList
          itemData={itemData}
          height={getHeight() + 2 * LISTBOX_PADDING}
          ref={gridRef}
          outerElementType={OuterElementType}
          innerElementType="ul"
          itemSize={index => getChildSize(itemData[index])}
          overscanCount={5}
          itemCount={itemCount}
        >
          {renderRow}
        </VariableSizeList>
      </OuterElementContext.Provider>
    </div>
  );
});

ListboxComponent.propTypes = {
  children: PropTypes.node
};

// Visual-only flattening (virtualization untouched), mirroring seriesselect.
const useStyles = makeStyles({
  root: {
    marginTop: 10,
    marginBottom: 10,
    width: '100%',
    '& .MuiOutlinedInput-root': { borderRadius: 4 },
    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--hairline-2)' },
    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--accent)' },
    '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: 'var(--accent)',
      borderWidth: 1
    },
    '& .MuiAutocomplete-input': {
      fontFamily: 'var(--mono)',
      fontSize: 12,
      color: 'var(--ink)'
    },
    '& .MuiChip-root': {
      fontFamily: 'var(--mono)',
      fontSize: 11,
      background: 'var(--panel)',
      color: 'var(--ink)',
      border: '1px solid var(--hairline-2)'
    },
    '& .MuiInputLabel-root': { fontFamily: 'var(--sans)', color: 'var(--ink-faint)' }
  },
  paper: {
    background: 'var(--panel-2)',
    border: '1px solid var(--hairline-2)',
    borderRadius: 6,
    color: 'var(--ink)'
  },
  option: { fontFamily: 'var(--mono)', fontSize: 12 },
  groupLabel: {
    fontFamily: 'var(--sans)',
    color: 'var(--ink-faint)',
    background: 'var(--panel)'
  },
  listbox: {
    boxSizing: 'border-box',
    '& ul': {
      padding: 0,
      margin: 0
    }
  }
});

function MultiSeriesSelect(props) {
  const classes = useStyles();
  // flat alphabetical list (grouping headers removed)
  const options = [...props.series].sort((a, b) => a.localeCompare(b));

  return (
    <div className={classes.root}>
      <Autocomplete
        disableClearable={true}
        value={props.value ? props.value : []}
        onClose={() => {
          if (props.dispatchClose) {
            props.dispatchClose();
          }
        }}
        disableCloseOnSelect={true}
        limitTags={1}
        multiple
        onChange={props.seriesCallback}
        id="virtualize-demo"
        disableListWrap
        classes={classes}
        ListboxComponent={ListboxComponent}
        options={options}
        renderInput={params => (
          <TextField
            {...params}
            variant="outlined"
            label={props.title || 'select series'}
          />
        )}
        renderOption={option => <Typography noWrap>{option}</Typography>}
      />
    </div>
  );
}

export { MultiSeriesSelect };
