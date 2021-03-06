import { MainLoadSuccess, Unload, MainLoadStart } from '../actions/main';
import { Reducer } from 'react';
import { Action } from 'redux';
import { ActionFlag } from '../actions';
import { StoreState } from '../../types';
import { AsyncModelState } from '../../types/common';

function loadStart(state: StoreState, action: MainLoadStart): StoreState {
    return {
        ...state,
        view: {
            loadingState: AsyncModelState.LOADING
        }
    };
}

function loadSuccess(state: StoreState, action: MainLoadSuccess): StoreState {
    return {
        ...state,
        view: {
            loadingState: AsyncModelState.SUCCESS,
            value: {
                views: {
                    addOrg: {
                        loadingState: AsyncModelState.NONE
                    },
                    browseOrgs: {
                        loadingState: AsyncModelState.NONE
                    },
                    manageRequests: {
                        loadingState: AsyncModelState.NONE
                    },
                    viewMembers: {
                        loadingState: AsyncModelState.NONE
                    },
                    viewOrg: {
                        loadingState: AsyncModelState.NONE
                    },
                }
            }
        }
        // views: {
        //     ...state.views,
        //     mainView: {
        //         ...state.views.mainView,
        //         loadingState: ComponentLoadingState.SUCCESS
        //     }
        // }
    };
}

function unload(state: StoreState, action: Unload): StoreState {
    return {
        ...state,
        view: {
            loadingState: AsyncModelState.NONE
        }
    };
}

const reducer: Reducer<StoreState | undefined, Action> = (state: StoreState | undefined, action: Action) => {
    if (!state) {
        return state;
    }
    switch (action.type) {
        case ActionFlag.MAIN_LOAD_START:
            return loadStart(state, action as MainLoadStart);
        case ActionFlag.MAIN_LOAD_SUCCESS:
            return loadSuccess(state, action as MainLoadSuccess);
        case ActionFlag.MAIN_UNLOAD:
            return unload(state, action as Unload);
    }
};

export default reducer;
