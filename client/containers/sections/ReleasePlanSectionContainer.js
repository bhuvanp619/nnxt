import {connect} from 'react-redux'
import * as A from '../../actions/index'
import {ReleasePlanSection} from "../../components"
import * as COC from '../../components/componentConsts'
import {withRouter} from 'react-router-dom'
import * as SC from '../../../server/serverconstants'

const mapDispatchToProps = (dispatch, ownProps) => ({
    ReleaseProjectGoBack: (release) => {
        dispatch(A.getReleaseFromServer(release._id)).then(json => {
            if (json.success) {
                dispatch(A.showComponentHideOthers(COC.RELEASE_LIST))
            }
        })
        dispatch(A.getAllReleasesFromServer("all"))

    },
    getAllReleasePlans: (release) => dispatch(A.getReleasePlansFromServer(release._id, 'all', 'all')),
    getAllWarnings: (release) => dispatch(A.getAllWarningsOfThisReleaseFromServer('all', release._id)),
    getAllTaskPlans: (release) => dispatch(A.getAllTaskPlansOfThisReleaseFromServer(release._id))
})

const mapStateToProps = (state) => ({
    loggedInUser: state.user.loggedIn,
    release: state.release.selectedRelease
})

const ReleasePlanSectionContainer = withRouter(connect(
    mapStateToProps,
    mapDispatchToProps
)(ReleasePlanSection))

export default ReleasePlanSectionContainer