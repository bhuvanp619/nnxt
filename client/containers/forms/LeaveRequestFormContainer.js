import {connect} from 'react-redux'
import {LeaveRequestForm} from "../../components"
import * as A from '../../actions'
import * as COC from '../../components/componentConsts'
import {NotificationManager} from 'react-notifications'
import * as EC from "../../../server/errorcodes";
import {SubmissionError} from "redux-form";

const mapDispatchToProps = (dispatch, ownProps) => ({
    onSubmit: (values) => {
        console.log("You are in Request initiate Form container ", values)
              return dispatch(A.addLeaveRequestOnServer(values)).then(json => {
                  if (json.success) {
                      NotificationManager.success('leave Request Added Successfully')
                      dispatch(A.hideComponent(COC.LEAVE_REQUEST_FORM_DIALOG))

                  } else {
                      NotificationManager.error('leave Request Not Added!')
                      if (json.code == EC.ALREADY_EXISTS)
                          throw new SubmissionError({name: "leave Request Already Exists"})
                  }
                  return json
              })



    }
})

const mapStateToProps = (state, ownProps) => ({
    leaveRequsts: state.leaveRequest.all,


})

const LeaveRequestFormCOntainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(LeaveRequestForm)

export default LeaveRequestFormCOntainer