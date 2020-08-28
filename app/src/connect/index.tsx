import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as Actions from '../actions';

const mapDispatchToProps = dispatch => {
  return {
    actions: bindActionCreators(Actions, dispatch)
  };
};

const mapStateToProps = state => {
  return {
    data: { ...state }
  };
};

export default function(
  mapState = mapStateToProps,
  mapDispatch = mapDispatchToProps
) {
  return connect(mapState, mapDispatch);
}
