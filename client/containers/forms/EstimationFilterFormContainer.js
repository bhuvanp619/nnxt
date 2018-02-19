import {connect} from 'react-redux'
import {EstimationFilterForm} from "../../components"
import * as A from '../../actions'
import * as COC from '../../components/componentConsts'
import {NotificationManager} from 'react-notifications'
import * as EC from "../../../server/errorcodes";
import {SubmissionError} from "redux-form";

const mapDispatchToProps = (dispatch, ownProps) => ({
    onSubmit: (formValues) => {
        console.log("get the form values",formValues)
        /*return dispatch(A.moveTaskIntoFeatureOnServer(formValues._id,formValues.feature_id)).then(json => {
            if (json.success) {
                NotificationManager.success('Task Moved Successfully')
                dispatch(A.hideComponent(COC.MOVE_TASK_TO_FEATURE_FORM_DIALOG))
            } else {
                NotificationManager.error('Process Failed')

            }
            return json
        })*/
    }
})

const mapStateToProps = (state, ownProps) => ({

    features: state.estimation.features,

})

const EstimationFilterFormContainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(EstimationFilterForm)

export default EstimationFilterFormContainer