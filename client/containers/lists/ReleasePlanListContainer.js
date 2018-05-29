import {connect} from 'react-redux'
import * as A from '../../actions'
import {ReleasePlanList} from "../../components"
import * as COC from '../../components/componentConsts'
import * as SC from '../../../server/serverconstants'
import {withRouter} from 'react-router-dom'


const mapDispatchToProps = (dispatch, ownProps) => ({
    releasePlanSelected: (releasePlan, role) => {
        console.log("Role", role)
        if (role === SC.ROLE_MANAGER) {
            // get all developers from user list when user role in this release is manager
            dispatch(A.getAllDeveloperFromServer())
        } else {
            // get project developers from user list when user role in this release is leader
            dispatch(A.getReleaseDevelopersFromServer(releasePlan._id))
        }
        dispatch(A.getReleasePlanDetailsFromServer(releasePlan._id)),
            dispatch(A.getAllTaskPlannedFromServer(releasePlan._id)),
        dispatch(A.showComponentHideOthers(COC.RELEASE_TASK_PLANNING_PAGE))
    },

    ReleaseProjectGoBack: () => {
        dispatch(A.getAllReleasesFromServer("all"))
        dispatch(A.showComponentHideOthers(COC.RELEASE_LIST))
    },

    changeReleaseFlag: (release, status, flag) => dispatch(A.getTaskReleaseFromServer(release, status, flag)),

    changeReleaseStatus: (release, status, flag) => dispatch(A.getTaskReleaseFromServer(release, status, flag))
})

const mapStateToProps = (state) => {
    return {
        loggedInUser: state.user.loggedIn,
        selectedRelease: state.release.selectedRelease,
        releasePlans: state.release.releasePlans
    }
}

const ReleasePlanListContainer = withRouter(connect(
    mapStateToProps,
    mapDispatchToProps
)(ReleasePlanList))

export default ReleasePlanListContainer