import Router from 'koa-router'
import * as MDL from "../models"
import * as EC from '../errorcodes'
import * as SC from '../serverconstants'
import AppError from '../AppError'
import _ from 'lodash'

/***
 * Added prefix
 */

let releaseRouter = new Router({
    prefix: "releases"
})

/***
 * Get all releases and by status filtering also
 ***/
releaseRouter.get("/status/:status", async ctx => {
    return await MDL.ReleaseModel.getReleases(ctx.params.status, ctx.state.user)
})

/***
 * Update Release dates to another date for re-schedule
 ***/
releaseRouter.put("/", async ctx => {
    return await MDL.ReleaseModel.updateReleaseDates(ctx.request.body, ctx.state.user, ctx.schemaRequested)
})

/***
 * Get release details by release Id
 ***/
releaseRouter.get("/release/:releaseID", async ctx => {

    let roleInRelease = await MDL.ReleaseModel.getUserHighestRoleInThisRelease(ctx.params.releaseID, ctx.state.user)
    if (!_.includes([SC.ROLE_LEADER, SC.ROLE_MANAGER], roleInRelease)) {
        throw new AppError("Only user with role [" + SC.ROLE_MANAGER + "or" + SC.ROLE_LEADER + "] can see Release list", EC.ACCESS_DENIED, EC.HTTP_FORBIDDEN)
    }

    return await MDL.ReleaseModel.getReleaseById(ctx.params.releaseID, roleInRelease, ctx.state.user)
})


/***
 * Get release plan details by release plan Id
 ***/
releaseRouter.get("/:releasePlanID/release-plan", async ctx => {
    return await MDL.ReleasePlanModel.getReleasePlanByID(ctx.params.releasePlanID, ctx.state.user)

})

/***
 * Get release developer team details by using release Id
 ***/
releaseRouter.get("/release-plan/:releasePlanID/role/developers", async ctx => {
    return await MDL.ReleasePlanModel.getReleaseDevelopersByReleasePlanID(ctx.params.releasePlanID, ctx.state.user)

})

/***
 * Get release list in which logged in user is involved as a manager or leader or developer or non project developer
 ***/
releaseRouter.get("/:releaseID/details-for-reporting", async ctx => {
    return await MDL.ReleaseModel.getReleaseDetailsForReporting(ctx.params.releaseID, ctx.state.user)
})

/***
 * Get release Plan list in which logged in user is involved as a manager or leader or developer or non project developer  by release ID and release plan status
 ***/
releaseRouter.get("/:releaseID/status/:status/flag/:empflag/release-plans", async ctx => {

    let roleInRelease = await MDL.ReleaseModel.getUserHighestRoleInThisRelease(ctx.params.releaseID, ctx.state.user)
    if (!_.includes([SC.ROLE_LEADER, SC.ROLE_MANAGER], roleInRelease)) {
        throw new AppError("Only user with role [" + SC.ROLE_MANAGER + " or " + SC.ROLE_LEADER + "] can see Release task list", EC.ACCESS_DENIED, EC.HTTP_FORBIDDEN)
    }

    return await MDL.ReleasePlanModel.getReleasePlansByReleaseID(ctx.params, ctx.state.user)

})


/***
 * Add task planning  in which logged in user is involved as a manager or leader
 ***/
releaseRouter.put("/plan-task/", async ctx => {
    return await MDL.TaskPlanningModel.addTaskPlanning(ctx.request.body, ctx.state.user, ctx.schemaRequested)
})


/***
 * Merge already planned task to another date for re-schedule
 ***/
releaseRouter.put("/merge-task-plan/", async ctx => {
    return await MDL.TaskPlanningModel.mergeTaskPlanning(ctx.request.body, ctx.state.user, ctx.schemaRequested)
})

/***
 * Shifting all task plans to future with base date and number of days to shift
 * - Can not shift to any holiday date
 * - Shift even task plan assigned on holiday to working days
 * - Can-not shift task plan to a future days leave from base date
 ***/
releaseRouter.put("/shift-future/", async ctx => {
    return await MDL.TaskPlanningModel.planningShiftToFuture(ctx.request.body, ctx.state.user, ctx.schemaRequested)

})

/***
 * Shifting all task plans to past with base date and number of days to shift
 * - Can not shift to any holiday date
 * - Shift even task plan assigned on holiday to working days
 * - Can-not shift task plan to a past days leave from base date
 ***/
releaseRouter.put("/shift-past/", async ctx => {
    return await MDL.TaskPlanningModel.planningShiftToPast(ctx.request.body, ctx.state.user, ctx.schemaRequested)
})

/***
 * Deletion of task plan by leader or manager of that release
 ***/
releaseRouter.del("/plan-task/:planID", async ctx => {
    return await MDL.TaskPlanningModel.deleteTaskPlanning(ctx.params.planID, ctx.state.user)
})


/***
 * Get all task plannings by release plan Id
 ***/
releaseRouter.get("/task-plans/:releasePlanID", async ctx => {
    return await MDL.TaskPlanningModel.getReleaseTaskPlanningDetails(ctx.params.releasePlanID, ctx.state.user)

})

/***
 * Get task planning schedule according to developer
 ***/
releaseRouter.get("/task-plans/employee/:employeeID/fromDate/:fromDate/toDate/:toDate", async ctx => {
    return await MDL.TaskPlanningModel.getTaskPlanningDetailsByEmpIdAndFromDateToDate(ctx.params.employeeID, ctx.params.fromDate, ctx.params.toDate, ctx.state.user)

})

/***
 * Add employee days detail of a employee of a particular date on task planning
 ***/
releaseRouter.post("/employee-days", async ctx => {
    let employeeDays = await MDL.EmployeeDaysModel.addEmployeeDaysDetails(ctx.request.body, ctx.state.user)
    if (!employeeDays) {
        throw new AppError("Not allowed to plan the task", EC.ACCESS_DENIED, EC.HTTP_FORBIDDEN)
    }
    return employeeDays
})


/***
 * Get all employee days detail without any filter
 ***/
releaseRouter.get("/employee-days/:id", async ctx => {
    return await MDL.EmployeeDaysModel.getActiveEmployeeDays(ctx.state.user)

})


/***
 * Add employee statistics detail of a employee which is having all leaves and all task details by release
 ***/
releaseRouter.post("/employee-statistics/", async ctx => {
    return await MDL.EmployeeStatisticsModel.addEmployeeStatisticsDetails(ctx.request.body, ctx.state.user)
})


/***
 * get all employee statistics detail
 ***/
releaseRouter.get("/employee-statistics/:id", async ctx => {
    return await MDL.EmployeeStatisticsModel.getActiveEmployeeStatistics(ctx.state.user)
})

releaseRouter.get("/task-plans/release/:releaseID", async ctx => {
    console.log("ctx.params.releaseID", ctx.params.releaseID)
    return await MDL.TaskPlanningModel.getAllTaskPlannings(ctx.params.releaseID, ctx.state.user)

})

releaseRouter.post("/add-planned-task", async ctx => {
    return await MDL.ReleasePlanModel.addPlannedReleasePlan(ctx.request.body, ctx.state.user)
})



export default releaseRouter