import * as AC from './actionConsts'
import * as A from "./index";
import * as COC from "../components/componentConsts";
import {NotificationManager} from "react-notifications";


export const addEstimations = (estimations) => ({
    type: AC.ADD_ESTIMATIONS,
    estimations: estimations
})

export const addEstimation = (estimation) => ({
    type: AC.ADD_ESTIMATION,
    estimation: estimation
})

export const editEstimation = (estimation) => ({
    type: AC.EDIT_ESTIMATION,
    estimation: estimation
})

export const taskEditRequest = (task) => ({
    type: AC.REQUEST_FOR_TASK_EDIT_PERMISSION,
    task: task
})

export const deleteEstimationTask = (task) => ({
    type: AC.DELETE_ESTIMATION_TASK,
    task: task
})

export const selectEstimation = (estimation) => ({
    type: AC.SELECT_ESTIMATION,
    estimation: estimation
})

export const addEstimationTask = (task) => ({
    type: AC.ADD_ESTIMATION_TASK,
    task: task
})

export const updateEstimationTask = (task) => ({
    type: AC.UPDATE_ESTIMATION_TASK,
    task: task
})

export const addEstimationFeature = (feature) => ({
    type: AC.ADD_ESTIMATION_FEATURE,
    feature: feature
})

export const updateEstimationFeature = (feature) => ({
    type: AC.UPDATE_ESTIMATION_FEATURE,
    feature: feature
})

export const estimationTaskDelete = (taskID) => ({
    type: AC.ESTIMATION_TASK_DELETE,
    taskID: taskID
})
export const moveTaskInFeature = (task) => ({
    type: AC.MOVE_TASK_IN_FEATURE,
    task: task
})
export const deleteEstimationFeature = (feature) => ({
    type: AC.DELETE_ESTIMATION_FEATURE,
    feature: feature
})

export const getAllEstimationsFromServer = () => {
    return (dispatch, getState) => {
        return fetch('/api/estimations', {
                method: 'get',
                credentials: "include",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            }
        ).then(
            response => response.json()
        ).then(
            json => {
                if (json.success) {
                    dispatch(addEstimations(json.data))
                }
            })
    }
}

export const initiateEstimationOnServer = (formInput) => {
    return (dispatch, getState) => {
        return fetch('/api/estimations/initiate', {
                method: 'post',
                credentials: "include",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formInput)
            }
        ).then(
            response => response.json()
        ).then(
            json => {
                if (json.success) {
                    dispatch(addEstimation(json.data))
                }

                return json
            })
    }
}

export const requestEstimationOnServer = (estimationID) => {
    return (dispatch, getState) => {
        return fetch('/api/estimations/request/' + estimationID, {
                method: 'put',
                credentials: "include",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({})
            }
        ).then(
            response => response.json()
        ).then(
            json => {
                if (json.success) {
                    dispatch(editEstimation(json.data))
                }
                return json
            })
    }
}

export const requestForTaskEditPermissionOnServer = (task) => {
    return (dispatch, getState) => {
        return fetch('/api/estimations/request-edit-permission-task', {
                method: 'put',
                credentials: "include",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(task)
            }
        ).then(
            response => response.json()
        ).then(
            json => {
                if (json.success) {
                    // As json.data would contain complete updated task just fire update redux action
                    dispatch(updateEstimationTask(json.data))
                }
                return json
            })
    }
}

export const deleteEstimationTaskOnServer = (estimationID, taskID) => {
    return (dispatch, getState) => {
        return fetch('/api/estimations/' + estimationID + '/tasks/' + taskID, {
                method: 'delete',
                credentials: "include",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            }
        ).then(
            response => response.json()
        ).then(
            json => {
                if (json.success) {
                    dispatch(deleteEstimationTask(json.data))
                }
                return json
            })
    }
}

export const requestForTaskDeletePermissionOnServer = (task) => {
    return (dispatch, getState) => {
        return fetch('/api/estimations/request-removal-task', {
                method: 'put',
                credentials: "include",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(task)
            }
        ).then(
            response => response.json()
        ).then(
            json => {
                if (json.success) {
                    dispatch(updateEstimationTask(json.data))
                }
                return json
            })
    }
}

export const requestReviewOnServer = (estimationID) => {
    return (dispatch, getState) => {
        return fetch('/api/estimations/review-request/' + estimationID, {
                method: 'put',
                credentials: "include",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({})
            }
        ).then(
            response => response.json()
        ).then(
            json => {
                if (json.success) {
                    dispatch(editEstimation(json.data))
                }
                return json
            })
    }
}


export const requestChangeOnServer = (estimationID) => {
    return (dispatch, getState) => {
        return fetch('/api/estimations/change-request/' + estimationID, {
                method: 'put',
                credentials: "include",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({})
            }
        ).then(
            response => response.json()
        ).then(
            json => {
                if (json.success) {
                    dispatch(editEstimation(json.data))
                }
                return json
            })
    }
}


export const addTaskToEstimationOnServer = (task) => {
    return (dispatch, getState) => {
        return fetch('/api/estimations/tasks', {
                method: 'post',
                credentials: "include",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(task)
            }
        ).then(
            response => response.json()
        ).then(
            json => {
                if (json.success) {
                    dispatch(addEstimationTask(json.data))
                }
                return json
            })
    }
}

export const updateTaskToEstimationOnServer = (task) => {
    return (dispatch, getState) => {
        return fetch('/api/estimations/tasks', {
                method: 'put',
                credentials: "include",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(task)
            }
        ).then(
            response => response.json()
        ).then(
            json => {
                if (json.success) {
                    dispatch(updateEstimationTask(json.data))
                }
                return json
            })
    }
}

export const addFeatureToEstimationOnServer = (feature) => {
    return (dispatch, getState) => {
        return fetch('/api/estimations/features', {
                method: 'post',
                credentials: "include",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(feature)
            }
        ).then(
            response => response.json()
        ).then(
            json => {
                if (json.success) {
                    dispatch(addEstimationFeature(json.data))
                }
                return json
            })
    }
}

export const updateFeatureToEstimationOnServer = (feature) => {
    return (dispatch, getState) => {
        return fetch('/api/estimations/features', {
                method: 'put',
                credentials: "include",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(feature)
            }
        ).then(
            response => response.json()
        ).then(
            json => {
                if (json.success) {
                    dispatch(updateEstimationFeature(json.data))
                }
                return json
            })
    }
}

export const getEstimationFromServer = (estimationID) => {
    return (dispatch, getState) => {
        return fetch('/api/estimations/' + estimationID, {
                method: 'get',
                credentials: "include",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            }
        ).then(
            response => response.json()
        ).then(
            json => {
                if (json.success) {
                    dispatch(selectEstimation(json.data))
                }
                return json
            })
    }
}


export const moveTaskIntoFeatureOnServer = (formInput) => {
    return (dispatch, getState) => {
        return fetch('/api/estimations/move-to-feature', {
                method: 'put',
                credentials: "include",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formInput)
            }
        ).then(
            response => response.json()
        ).then(
            json => {
                if (json.success) {
                    dispatch(moveTaskInFeature(json.data))

                }
                return json
            })
    }
}

export const moveTaskOutOfFeatureOnServer = (formInput) => {
    return (dispatch, getState) => {
        return fetch('/api/estimations/move-out-of-feature', {
                method: 'put',
                credentials: "include",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formInput)
            }
        ).then(
            response => response.json()
        ).then(
            json => {
                if (json.success) {
                    NotificationManager.success('Task removed out of feature Successfully')
                    dispatch(A.hideComponent(COC.MOVE_TASK_TO_FEATURE_FORM_DIALOG))
                    //dispatch(addEstimation(json.data))
                }
                else{
                    NotificationManager.error('Process Failed')
                }

                return json
            })
    }
}


export const grantEditPermissionOfTaskOnServer = (formInput) => {
    return (dispatch, getState) => {
        return fetch('/api/estimations/grant-edit-permission-task', {
                method: 'put',
                credentials: "include",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formInput)
            }
        ).then(
            response => response.json()
        ).then(
            json => {
                if (json.success) {
                    NotificationManager.success('Permission Granted Successfully')
                    dispatch(updateEstimationTask(json.data))
                }
                else{
                    NotificationManager.error('Permission Granted Failed')
                }

                return json
            })
    }
}

export const deleteFeatureByEstimatorOnServer = (estimationID, featureID) => {
    return (dispatch, getState) => {
        return fetch('/api/estimations/' + estimationID + '/feature/' + featureID, {
                method: 'delete',
                credentials: "include",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            }
        ).then(
            response => response.json()
        ).then(
            json => {
                if (json.success) {
                    dispatch(deleteEstimationFeature(json.data))
                }
                return json
            })
    }
}
