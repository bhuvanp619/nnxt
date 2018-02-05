import {connect} from 'react-redux'
import {withRouter} from 'react-router-dom'
import {EstimationDetail} from "../../components"
import * as A from '../../actions'
import {NotificationManager} from 'react-notifications'
import * as EC from '../../../server/errorcodes'
import * as COC from '../../components/componentConsts'
import {initialize} from 'redux-form'

const mapDispatchToProps = (dispatch, ownProps) => ({
    showAddTaskForm: (estimation) => {
        dispatch(A.showComponent(COC.ESTIMATION_TASK_DIALOG))
        // initialize
        dispatch(initialize('estimation-task', {
            estimation: {
                _id: estimation._id
            }
        }))
    },
    showAddFeatureForm: (estimation) => {
        dispatch(A.showComponent(COC.ESTIMATION_FEATURE_DIALOG))
        // initialize
        dispatch(initialize('estimation-feature', {
            estimation: {
                _id: estimation._id
            }
        }))
    },
    showEditFeatureForm: (values) => {
        dispatch(A.showComponent(COC.ESTIMATION_FEATURE_DIALOG))
        // initialize
        let feature = {}
        feature.estimation = values.estimation
        feature._id = values._id
        feature.name = values.estimator.name
        feature.description = values.estimator.description
        dispatch(initialize('estimation-feature', feature))
    },
    sendEstimationRequest: (estimation) => {
        dispatch(A.requestEstimationOnServer(estimation._id)).then(json => {
            if (json.success) {
                NotificationManager.success("Estimation requested successfully")
            } else {
                if (json.code == EC.INVALID_OPERATION)
                    NotificationManager.error("Estimation already requested")
                else
                    NotificationManager.error("Unknown error occurred")
            }
        })
    },
    onTaskDelete: (taskID) => {
        dispatch(A.estimationTaskDelete(taskID))
    }
})


const mapStateToProps = (state) => ({
    loggedInUser: state.user.loggedIn,
    estimation: state.estimation.selected,
    features: state.estimation.features
})

const EstimationDetailContainer = withRouter(connect(
    mapStateToProps,
    mapDispatchToProps
)(EstimationDetail))

export default EstimationDetailContainer
