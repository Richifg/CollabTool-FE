import connectItem from './connectItem';
import disconnectItem from './disconnectItem';
import processItemDeletions from './processItemDeletions';
import processItemUpdates from './processItemUpdates';
import updateBoardLimits from './updateBoardLimits';
import updateConnectedLines from './updateConnectedLines';
import updateLineConnections from './updateLineConnections';
import updateMaxZIndices from './updateMaxZIndices';

// BoardStateMachine util functions are not pure functions like the ones in the src/utils folder
// these have side effects because they import the store to check state and dispatch actions

export {
    connectItem,
    disconnectItem,
    processItemDeletions,
    processItemUpdates,
    updateBoardLimits,
    updateConnectedLines,
    updateLineConnections,
    updateMaxZIndices,
};
