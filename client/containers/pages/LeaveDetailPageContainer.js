import {connect} from 'react-redux'
import {LeaveDetailPage} from '../../components'
import * as A from '../../actions'
import * as COC from '../../components/componentConsts'
import * as SC from '../../../server/serverconstants'

const mapDispatchToProps = (dispatch, ownProps) => ({
    leaveGoBack: (event) => {
        dispatch(A.getAllLeavesFromServer(SC.ALL))
        dispatch(A.showComponentHideOthers(COC.LEAVE_LIST))
    }
})


const mapStateToProps = (state) => ({
    leave: state.leave.selected
})

const LeaveDetailPageContainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(LeaveDetailPage)

export default LeaveDetailPageContainer
