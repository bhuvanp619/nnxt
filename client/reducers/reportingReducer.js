import * as AC from '../actions/actionConsts'
import moment from 'moment'
import * as SC from '../../server/serverconstants'
import * as U from '../../server/utils'

let now = new Date()
let initialState = {
    allReleases: [],
    availableReleases: [],
    taskPlan: {},
    releasePlan: {},
    release: {},
    releaseID: SC.ALL,
    reportedStatus: SC.ALL,
    iterationType: SC.ITERATION_TYPE_PLANNED,
    dateStringOfReport: U.getNowStringInIndia(),
    reportedTasks: [],
    releasesReports: [],
    reportTaskDetail: {
        taskPlan: {},
        taskPlans: [],
        release: {},
        releasePlan: {}
    }
}

const reportingReducer = (state = initialState, action) => {
    switch (action.type) {
        case AC.ADD_USER_RELEASES:
            // All Releases where loggedIn user in involved as (manager, leader, developer)
            return Object.assign({}, state, {
                allReleases: action.releases
            })

        case AC.ADD_RELEASES_AND_TASKS_OF_SELECTED_DATE:
            // Releases and its task plans where loggedIn user in involved as (manager, leader, developer) for selected date
            return Object.assign({}, state, {
                availableReleases: action.reportReleases,
                activeReleases: action.activeReleases,
                dateStringOfReport: action.date
            })
        case AC.TASK_REPORTED:
            return Object.assign({}, state, {
                availableReleases: state.availableReleases.map(r => {
                    if (r._id.toString() == action.task.release._id.toString()) {
                        return Object.assign({}, r, {
                            tasks: r.tasks.map(t => {
                                if (t._id.toString() == action.task._id.toString()) {
                                    return action.task
                                } else
                                    return t
                            })
                        })
                    } else
                        return r

                })
            })

        case AC.REPORT_TASK_SELECTED:
            // task is selected to see task detail
            return Object.assign({}, state, {
                reportTaskDetail: {
                    taskPlan: action.detail.taskPlan,
                    taskPlans: action.detail.taskPlans,
                    release: action.detail.release,
                    releasePlan: Object.assign({}, action.detail.releasePlan, {
                        estimationDescription: action.detail.estimationDescription
                    })
                }
            })

        case AC.UPDATE_SELECTED_TASK_PLAN:
            // task is selected to see task detail
            return Object.assign({}, state, {
                taskPlan: action.project.taskPlan
            })

        case AC.UPDATE_SELECTED_RELEASE_PLAN:
            // task is selected to see task detail
            return Object.assign({}, state, {
                reportTaskDetail: Object.assign({}, state.reportTaskDetail, {
                    releasePlan: action.releasePlan
                })
            })

        case AC.SET_REPORT_DATE:
            // while selection of reporting date it is set to state also
            return Object.assign({}, state, {
                dateStringOfReport: action.reportDate
            })

        case AC.SET_STATUS:
            // while selection of reporting status it is set to state also
            return Object.assign({}, state, {
                status: action.status
            })

        case AC.SET_RELEASE_ID:
            // while selection of reporting releaseID it is set to state also
            return Object.assign({}, state, {
                releaseID: action.releaseID
            })

        case AC.SET_ITERATION_TYPE:
            // while selection of reporting iteration type it is set to state also
            return Object.assign({}, state, {
                iterationType: action.iterationType
            })

        case AC.SET_REPORTS_OF_RELEASE:
            // while task plan need to see report list by manager and leader
            return Object.assign({}, state, {
                releasesReports: action.reports
            })

        default:
            return state
    }
}

export default reportingReducer