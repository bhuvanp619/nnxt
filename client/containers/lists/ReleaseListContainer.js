import {connect} from 'react-redux'
import * as A from '../../actions'
import {ReleaseList} from "../../components"
import * as COC from '../../components/componentConsts'
import * as SC from '../../../server/serverconstants'

const mapDispatchToProps = (dispatch, ownProps) => ({
    onLoad: () => {
        dispatch(A.searchReleaseFromServer({
            showActive: true
        }))
        dispatch(A.getUsersWithRoleCategoryFromServer())
    },
    changeReleaseStatus: (status, flag) => dispatch(A.getAllReleasesFromServer(status, flag)),
    showAllReleasesChanged: (status, flag) => dispatch(A.getAllReleasesFromServer(status, flag)),
    releaseSelected: (release) => {
        dispatch(A.getReleaseFromServer(release._id)).then(json => {
            if (json.success) {
                dispatch(A.showComponentHideOthers(COC.RELEASE_PLAN_SECTION))
            }
        })
    },
    showCreateReleaseDialog: () => {
        dispatch(A.getAllProjectsFromServer())
        dispatch(A.getAllModulesFromServer())
        dispatch(A.getUsersWithRoleCategoryFromServer())
        dispatch(A.getAllTechnologiesFromServer())
        dispatch(A.getAllDevelopmentTypesFromServer())
        dispatch(A.showComponent(COC.CREATE_RELEASE_FORM_DIALOG))
    },
    fetchReleases: (value) => {
        console.log("fetch releases result values at container", value)
        dispatch(A.searchReleaseFromServer(value))
    }
})

const mapStateToProps = (state, ownProps) => ({
    releases: state.release.all,
    leaders: state.user.userWithRoleCategory && state.user.userWithRoleCategory.leaders ? state.user.userWithRoleCategory.leaders : [],
    managers: state.user.userWithRoleCategory && state.user.userWithRoleCategory.managers ? state.user.userWithRoleCategory.managers : [],
    initialValues: state.release.releaseFilters
})

const ReleaseListContainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(ReleaseList)

export default ReleaseListContainer