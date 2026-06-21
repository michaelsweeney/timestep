import { makeStyles } from '@material-ui/core/styles';

// Shared flat / token styling for the per-pane chart Option controls (color
// scale + category selects, the reverse checkbox, input labels). Keeps them in
// lock-step with the de-Materialized seriesselect / rangeslider treatment
// instead of reading as default Material. Native <select> dropdown lists render
// OS-native (unavoidable for `Select native`); the closed control + labels use
// the token palette.
export const useControlStyles = makeStyles(
  {
    label: {
      fontFamily: 'var(--sans) !important',
      fontSize: '11px !important',
      letterSpacing: '0.04em',
      color: 'var(--ink-faint) !important',
      textTransform: 'uppercase',
      marginBottom: 4,
      transform: 'none !important',
      position: 'static'
    },
    nativeSelect: {
      minWidth: 160,
      marginTop: 2,
      '&:before': { display: 'none' },
      '&:after': { display: 'none' },
      '& select': {
        fontFamily: 'var(--sans)',
        fontSize: 13,
        color: 'var(--ink)',
        background: 'var(--panel-2)',
        border: '1px solid var(--hairline-2)',
        borderRadius: 4,
        padding: '6px 26px 6px 8px'
      },
      '& select:hover': { borderColor: 'var(--accent)' },
      '& select:focus': { borderColor: 'var(--accent)', background: 'var(--panel-2)' },
      '& option': { background: 'var(--panel-2)', color: 'var(--ink)' },
      '& .MuiNativeSelect-icon': { color: 'var(--ink-dim)' }
    },
    checkbox: {
      color: 'var(--ink-dim) !important',
      padding: 4,
      '&.Mui-checked': { color: 'var(--accent) !important' }
    }
  },
  { name: 'chart-controls' }
);
