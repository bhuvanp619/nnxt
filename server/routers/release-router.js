import Router from 'koa-router'
import {ReleaseModel,ReleasePlanModel} from "../models"
import {hasRole, isAuthenticated} from "../utils"
import * as SC from "../serverconstants"
import * as EC from '../errorcodes'
import AppError from '../AppError'
import * as V from '../validation'
import {generateSchema} from "../validation"

let releaseRouter = new Router({
    prefix: "releases"
})

releaseRouter.get("/", async ctx => {
    return await ReleaseModel.getReleases(ctx.state.user)
})

releaseRouter.get("/:releaseID", async ctx => {
    let release = await ReleaseModel.getById(ctx.params.releaseID)
    if (!release) {
            throw new AppError("Not allowed to release details", EC.ACCESS_DENIED, EC.HTTP_FORBIDDEN)
        }
    return release
})


releaseRouter.get("/:releaseID/release-plans", async ctx => {
    let releasePlans = await ReleasePlanModel.getReleasePlansByReleaseID(ctx.params.releaseID,ctx.state.user)
    if (!releasePlans) {
        throw new AppError("Not allowed to releases plans details", EC.ACCESS_DENIED, EC.HTTP_FORBIDDEN)
    }
    return releasePlans
})


export default releaseRouter