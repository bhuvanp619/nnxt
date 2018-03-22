import {connect} from 'react-redux'
import {ReleaseTaskDetailPage} from '../../components'
import * as A from '../../actions'
import * as COC from '../../components/componentConsts'
import {initialize} from 'redux-form'
import * as SC from '../../../server/serverconstants'
import {NotificationManager} from 'react-notifications'

const mapDispatchToProps = (dispatch, ownProps) => ({

    showTaskPlanningCreationForm: (releasePlan) => {
        dispatch(initialize("task-planning", {
            release: releasePlan.release,
            task: releasePlan.task,
            releasePlan: {
                _id: releasePlan._id,
            },
            flags: SC.REPORT_UNREPORTED,
            report: {
                status: SC.REPORT_PENDING
            }

        }))
        dispatch(A.showComponent(COC.RELEASE_TASK_PLANNING_FORM_DIALOG))
    },

    deleteTaskPlanningRow: (plan) => dispatch(A.deleteTaskPlanningFromState(plan.localId)),
    mergeTaskPlanningRow: (plan) => console.log(" mergeTaskPlanningRow"),

    planTask: (taskPlanning) => dispatch(A.addTaskPlanningOnServer(taskPlanning)).then(json => {
        if (json.success) {
            NotificationManager.success("Task Planning Added")
        }
        else NotificationManager.error("Task Planning Added")
    }),
    planTaskFilter: (taskPlanFilter) => dispatch(A.addTaskPlanningFiltersOnServer(taskPlanFilter)).then(json => {
        if (json.success) {
            NotificationManager.success("Task Planning Added")
        }
        else NotificationManager.error("Task Planning Added")
    }),
    ReleaseTaskGoBack: (event) =>
        dispatch(A.showComponentHideOthers(COC.RELEASE_DETAIL_LIST))
})


const mapStateToProps = (state) => ({
    loggedInUser: state.user.loggedIn,
    releasePlan: state.release.selectedTaskPlan,
    taskPlanning: state.release.taskPlanning,
    developerPlanned: state.release.developerPlanned,
    data: []
})

const ReleaseTaskDetailPageContainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(ReleaseTaskDetailPage)

export default ReleaseTaskDetailPageContainer