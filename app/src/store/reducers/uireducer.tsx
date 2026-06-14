// UI-only state that isn't part of a session — currently just the color theme.
// Seeded from localStorage so the choice survives relaunches; the write-back is
// done by a store subscription in configureStore (keeps the reducer pure).
const STORAGE_KEY = 'timestep-theme';

const readStoredTheme = (): 'light' | 'dark' => {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
};

const initialState = {
  theme: readStoredTheme()
};

export default function uiReducer(state = initialState, action) {
  switch (action.type) {
    case 'TOGGLE_THEME':
      return { ...state, theme: state.theme === 'dark' ? 'light' : 'dark' };
    case 'SET_THEME':
      return { ...state, theme: action.payload === 'dark' ? 'dark' : 'light' };
    default:
      return state;
  }
}

export { STORAGE_KEY };
