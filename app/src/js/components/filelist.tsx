import React, { useState } from 'react';
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

const FileList = props => {
  return (
    <div>
      <ExpansionPanel style={{ width: 500 }}>
        <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
          Files ({props.files.length})
        </ExpansionPanelSummary>

        <ExpansionPanelDetails>
          <ul>
            {props.files.map(e => (
              <li key={e}>{e.split('/')[e.split('/').length - 1]}</li>
            ))}
          </ul>
        </ExpansionPanelDetails>
      </ExpansionPanel>
    </div>
  );
};

export { FileList };
