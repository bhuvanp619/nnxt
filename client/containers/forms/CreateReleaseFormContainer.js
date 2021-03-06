import {connect} from 'react-redux'
import {CreateReleaseForm} from "../../components"
import * as logger from '../../clientLogger'
import * as A from '../../actions'
import {CLIENT_ARIPRA} from "../../clientconstants";
import * as COC from '../../components/componentConsts'
import {NotificationManager} from 'react-notifications'

const mapDispatchToProps = (dispatch) => ({
    fetchProjects: (clientID) => {
        console.log("fetchProjects() called ", clientID)
        if (clientID == CLIENT_ARIPRA) {
            return dispatch(A.searchProjectsFromServer({
                name: CLIENT_ARIPRA,
                isActive:true
            }))

        } else {
            // fetch projects of this client
            return dispatch(A.searchProjectsFromServer({
                _id: clientID,
                isActive:true
            }))
        }
    },
    onSubmit: (formInput) => {
        logger.debug(logger.ESTIMATION_PROJECT_AWARD_FORM_SUBMIT, "formInput:", formInput)
        return dispatch(A.createReleaseOnServer(formInput)).then(json => {
            if (json.success) {
                NotificationManager.success("Release Created")
                // hide dialog
                dispatch(A.hideComponent(COC.CREATE_RELEASE_FORM_DIALOG))
            } else {
                NotificationManager.error(json.message)
            }
        })
    }
})
const mapStateToProps = (state) => {

    let managers = []
    let leaders = []
    let team = []

    if (state.user.userWithRoleCategory) {
        // Users who has role as a manager or leader or both
        managers = state.user.userWithRoleCategory && state.user.userWithRoleCategory.managers ? state.user.userWithRoleCategory.managers : []
        leaders = state.user.userWithRoleCategory && state.user.userWithRoleCategory.leaders ? state.user.userWithRoleCategory.leaders : []
        team = state.user.userWithRoleCategory && state.user.userWithRoleCategory.team ?
            state.user.userWithRoleCategory.team.map((dev, idx) => {
                dev.name = dev.firstName + ' ' + dev.lastName
                return dev
            })
            : []

    }



    return {
        team,
        managers,
        leaders,
        projects: state.project.filtered,
        technologies: state.technology.all,
        developmentTypes: state.developmentType.all,
        modules: state.module.all,
        clients: state.client.billable && Array.isArray(state.client.billable) && state.client.billable.length ? state.client.billable.filter(client =>
            client.isActive === true
        ) : []
    }
}

const CreateReleaseFormContainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(CreateReleaseForm)

export default CreateReleaseFormContainer