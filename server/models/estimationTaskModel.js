import mongoose from 'mongoose'
import AppError from '../AppError'
import * as EC from '../errorcodes'
import * as SC from "../serverconstants"
import * as V from "../validation"
import {userHasRole} from "../utils"
import {EstimationFeatureModel, EstimationModel, RepositoryModel} from "./"
import _ from 'lodash'

mongoose.Promise = global.Promise

let estimationTaskSchema = mongoose.Schema({
    status: {type: String, enum: [SC.STATUS_APPROVED, SC.STATUS_PENDING], required: true, default: SC.STATUS_PENDING},
    owner: {type: String, enum: [SC.OWNER_ESTIMATOR, SC.OWNER_NEGOTIATOR], required: true},
    addedInThisIteration: {type: Boolean, required: true},
    canApprove: {type: Boolean, default: false},
    hasError: {type: Boolean, default: true},
    initiallyEstimated: {type: Boolean, required: true},
    isDeleted: {type: Boolean, default: false},
    created: Date,
    updated: Date,
    estimation: {
        _id: {type: mongoose.Schema.ObjectId, required: true}
    },
    feature: {
        _id: {type: mongoose.Schema.ObjectId}
    },
    repo: {
        _id: mongoose.Schema.ObjectId,
        addedFromThisEstimation: {type: Boolean, required: true}
    },
    estimator: {
        name: {type: String},
        description: {type: String},
        estimatedHours: {type: Number},
        changeRequested: {type: Boolean, default: false},
        changedKeyInformation: {type: Boolean, default: false},
        removalRequested: {type: Boolean, default: false},
        changedInThisIteration: {type: Boolean, default: false},
        isMovedToFeature: {type: Boolean, default: false},
        isMovedOutOfFeature: {type: Boolean, default: false}
    },
    negotiator: {
        name: {type: String},
        description: {type: String},
        estimatedHours: {type: Number},
        changeSuggested: {type: Boolean, default: false},
        changeGranted: {type: Boolean, default: false},
        changedInThisIteration: {type: Boolean, default: false},
        isMovedToFeature: {type: Boolean, default: false},
        isMovedOutOfFeature: {type: Boolean, default: false}
    },
    technologies: [String],
    tags: [String],
    notes: [{
        name: {type: String, required: true},
        note: {type: String, required: true},
        date: {type: Date, default: Date.now()}
    }]
})


estimationTaskSchema.statics.getAllTasksOfEstimation = async (estimationID, user) => {

    let role = await EstimationModel.getUserRoleInEstimation(estimationID, user)
    if (role === SC.ROLE_ESTIMATOR || role === SC.ROLE_NEGOTIATOR)
        return await EstimationTaskModel.find({"estimation._id": estimationID})

}


// adding task to task model
estimationTaskSchema.statics.addTask = async (taskInput, user, schemaRequested) => {
    if (!taskInput || !taskInput.estimation || !taskInput.estimation._id)
        throw new AppError('Estimation Identifier required at [estimation._id]', EC.NOT_FOUND, EC.HTTP_BAD_REQUEST)
    let role = await EstimationModel.getUserRoleInEstimation(taskInput.estimation._id, user)
    if (role === SC.ROLE_ESTIMATOR) {
        if (schemaRequested)
            return V.generateSchema(V.estimationEstimatorAddTaskStruct)
        return await addTaskByEstimator(taskInput, user)
    } else if (role === SC.ROLE_NEGOTIATOR) {
        if (schemaRequested)
            return V.generateSchema(V.estimationNegotiatorAddTaskStruct)
        return await addTaskByNegotiator(taskInput, user)
    }
    throw new AppError('You play no role in this estimation', EC.INVALID_USER, EC.HTTP_BAD_REQUEST)
}

// adding task by Estimator
const addTaskByEstimator = async (taskInput, estimator) => {
    V.validate(taskInput, V.estimationEstimatorAddTaskStruct)
    if (!estimator || !userHasRole(estimator, SC.ROLE_ESTIMATOR))
        throw new AppError('Not an estimator', EC.INVALID_USER, EC.HTTP_BAD_REQUEST)
    let estimation = await EstimationModel.findById(taskInput.estimation._id)
    if (!estimation)
        throw new AppError('Estimation not found', EC.NOT_FOUND, EC.HTTP_BAD_REQUEST)

    if (!estimation.estimator._id == estimator._id)
        throw new AppError('You are not estimator of this estimation', EC.INVALID_USER, EC.HTTP_FORBIDDEN)

    if (!_.includes([SC.STATUS_ESTIMATION_REQUESTED, SC.STATUS_CHANGE_REQUESTED], estimation.status))
        throw new AppError("Estimation has status as [" + estimation.status + "]. Estimator can only add task into those estimations where status is in [" + SC.STATUS_ESTIMATION_REQUESTED + ", " + SC.STATUS_CHANGE_REQUESTED + "]", EC.INVALID_OPERATION, EC.HTTP_BAD_REQUEST)


    if (taskInput.feature && taskInput.feature._id) {
        // task is part of some feature,
        let estimationFeature = await EstimationFeatureModel.findById(taskInput.feature._id)
        if (!estimationFeature || estimationFeature.estimation._id.toString() != estimation._id.toString()) {
            throw new AppError('No such feature in this estimation', EC.NOT_FOUND, EC.HTTP_BAD_REQUEST)
        }

        if (await EstimationTaskModel.count({
                "hasError": true,
                "isDeleted": false,
                "feature._id": estimationFeature._id,
                "estimation._id": estimation._id
            }) > 0
            || _.isEmpty(estimationFeature.estimator.name)
            || _.isEmpty(estimationFeature.estimator.description)
            || !taskInput.estimatedHours
            || taskInput.estimatedHours == 0
            || _.isEmpty(taskInput.name)
            || _.isEmpty(taskInput.description)) {

            console.log("taskInput.estimatedHours", taskInput.estimatedHours)
            console.log("taskInput", taskInput)
            console.log("hasErrortrue", true)
            // As task is being added into feature estimated hours of task would be added into current estimated hours of feature and with  error has Error become true
            await EstimationFeatureModel.updateOne({_id: taskInput.feature._id}, {
                $inc: {"estimator.estimatedHours": taskInput.estimatedHours},
                "hasError": true
            })
        } else {
            console.log("taskInput.estimatedHours", taskInput.estimatedHours)
            console.log("taskInput", taskInput)
            console.log("hasErrortrue", false)
            // As task is being added into feature estimated hours of task would be added into current estimated hours of feature and with no error has Error become false
            await EstimationFeatureModel.updateOne({_id: taskInput.feature._id}, {
                $inc: {"estimator.estimatedHours": taskInput.estimatedHours},
                "hasError": false
            })
        }


    }
    if (estimation && estimation._id) {
        await EstimationModel.updateOne({_id: estimation._id}, {$inc: {"estimatedHours": taskInput.estimatedHours}})
    }

    let estimationTask = new EstimationTaskModel()
    estimationTask.estimator.name = taskInput.name
    estimationTask.estimator.description = taskInput.description
    estimationTask.estimator.estimatedHours = taskInput.estimatedHours
    estimationTask.negotiator.estimatedHours = 0
    estimationTask.status = SC.STATUS_PENDING
    estimationTask.addedInThisIteration = true
    estimationTask.canApprove = false
    estimationTask.hasError = false
    estimationTask.owner = SC.OWNER_ESTIMATOR
    estimationTask.initiallyEstimated = true
    estimationTask.estimation = taskInput.estimation
    estimationTask.technologies = estimation.technologies
    // Add repository reference and also note that this task was added into repository from this estimation
    estimationTask.feature = taskInput.feature
    estimationTask.repo = {}
    //estimationTask.repo._id = repositoryTask._id
    if ((!estimationTask.estimator.estimatedHours || estimationTask.estimator.estimatedHours == 0)
        || _.isEmpty(estimationTask.estimator.name)
        || _.isEmpty(estimationTask.estimator.description)) {
        estimationTask.hasError = true
    } else estimationTask.hasError = false

    estimationTask.repo.addedFromThisEstimation = true
    if (!_.isEmpty(taskInput.notes)) {
        estimationTask.notes = taskInput.notes.map(n => {
            n.name = estimator.fullName
            return n
        })
    }

    return await estimationTask.save()
}

// adding task by Negotiator
const addTaskByNegotiator = async (taskInput, negotiator) => {
    V.validate(taskInput, V.estimationNegotiatorAddTaskStruct)
    let estimationFeatureObj
    if (!negotiator || !userHasRole(negotiator, SC.ROLE_NEGOTIATOR))
        throw new AppError('Not a negotiator', EC.INVALID_USER, EC.HTTP_BAD_REQUEST)
    let estimation = await EstimationModel.findById(taskInput.estimation._id)
    if (!estimation)
        throw new AppError('Estimation not found', EC.NOT_FOUND, EC.HTTP_BAD_REQUEST)
    if (!_.includes([SC.STATUS_INITIATED, SC.STATUS_REVIEW_REQUESTED], estimation.status))
        throw new AppError("Estimation has status as [" + estimation.status + "]. Negotiator can only add task into those estimations where status is in [" + SC.STATUS_INITIATED + ", " + SC.STATUS_REVIEW_REQUESTED + "]", EC.INVALID_OPERATION, EC.HTTP_BAD_REQUEST)

    if (taskInput.feature && taskInput.feature._id) {
        // task is part of some feature,

        estimationFeatureObj = await EstimationFeatureModel.findById(taskInput.feature._id)
        if (!estimationFeatureObj)
            throw new AppError('Feature not found', EC.NOT_FOUND, EC.HTTP_BAD_REQUEST)

        if (estimation._id.toString() != estimationFeatureObj.estimation._id.toString())
            throw new AppError('Feature not found for this estimation', EC.NOT_FOUND, EC.HTTP_BAD_REQUEST)

        // As task is being added by negotiator there would be any change in estimated hours of feature as this would just be considered as suggestions
        await EstimationFeatureModel.updateOne({_id: taskInput.feature._id}, {$inc: {"negotiator.estimatedHours": taskInput.estimatedHours}})
    }
    if (estimation && estimation._id) {
        await EstimationModel.updateOne({_id: estimation._id}, {$inc: {"suggestedHours": taskInput.estimatedHours}})
    }

    let estimationTask = new EstimationTaskModel()
    estimationTask.negotiator.name = taskInput.name
    estimationTask.negotiator.description = taskInput.description
    estimationTask.negotiator.estimatedHours = taskInput.estimatedHours
    estimationTask.negotiator.changeSuggested = true
    estimationTask.status = SC.STATUS_PENDING
    estimationTask.addedInThisIteration = true
    estimationTask.owner = SC.OWNER_NEGOTIATOR
    estimationTask.initiallyEstimated = true
    estimationTask.canApprove = false
    estimationTask.estimation = taskInput.estimation
    estimationTask.technologies = estimation.technologies
    // Add repository reference and also note that this task was added into repository from this estimation
    estimationTask.repo = {}
    //estimationTask.repo._id = repositoryTask._id
    estimationTask.repo.addedFromThisEstimation = true
    // Add name/description into estimator section as well, estimator can review and add estimated hours against this task
    //estimationTask.estimator.name = taskInput.name
    // estimationTask.estimator.description = taskInput.description
    estimationTask.feature = taskInput.feature
    if (!_.isEmpty(taskInput.notes)) {
        estimationTask.notes = taskInput.notes.map(n => {
            n.name = negotiator.fullName
            return n
        })
    }

    await estimationTask.save()
    estimationTask = estimationTask.toObject()
    if (estimation && estimation.canApprove) {
        estimationTask.isEstimationCanApprove = true
    }
    if (estimationFeatureObj && estimationFeatureObj.canApprove) {
        estimationTask.isFeatureCanApprove = true
    }
    return estimationTask
}

// updating task to task model
estimationTaskSchema.statics.updateTask = async (taskInput, user, schemaRequested) => {
    if (!taskInput || !taskInput.estimation || !taskInput.estimation._id)
        throw new AppError('Estimation Identifier required at [estimation._id]', EC.NOT_FOUND, EC.HTTP_BAD_REQUEST)
    let role = await EstimationModel.getUserRoleInEstimation(taskInput.estimation._id, user)
    if (role === SC.ROLE_ESTIMATOR) {
        if (schemaRequested)
            return V.generateSchema(V.estimationEstimatorUpdateTaskStruct)
        return await updateTaskByEstimator(taskInput, user)
    } else if (role === SC.ROLE_NEGOTIATOR) {
        if (schemaRequested)
            return V.generateSchema(V.estimationNegotiatorUpdateTaskStruct)
        return await updateTaskByNegotiator(taskInput, user)
    }
    throw new AppError('You play no role in this estimation', EC.INVALID_USER, EC.HTTP_BAD_REQUEST)
}

// updating task by Estimator
const updateTaskByEstimator = async (taskInput, estimator) => {

    V.validate(taskInput, V.estimationEstimatorUpdateTaskStruct)
    if (!estimator || !userHasRole(estimator, SC.ROLE_ESTIMATOR))
        throw new AppError('Not an estimator', EC.INVALID_USER, EC.HTTP_BAD_REQUEST)

    let estimationTask = await EstimationTaskModel.findById(taskInput._id)
    if (!estimationTask)
        throw new AppError('Estimation task not found', EC.NOT_FOUND, EC.HTTP_BAD_REQUEST)
    if (estimationTask.status != SC.STATUS_PENDING) {
        if (estimationTask.owner == SC.OWNER_ESTIMATOR && !estimationTask.addedInThisIteration && !estimationTask.negotiator.changeSuggested && !estimationTask.negotiator.changeGranted) {
            throw new AppError('Not allowed to update task as Negotiator has not granted permission', EC.ACCESS_DENIED, EC.HTTP_BAD_REQUEST)
        } else if (estimationTask.owner == SC.OWNER_NEGOTIATOR && !estimationTask.negotiator.changeSuggested && !estimationTask.negotiator.changeGranted) {
            throw new AppError('Not allowed to update task as Negotiator has not granted permission', EC.ACCESS_DENIED, EC.HTTP_BAD_REQUEST)
        }
    }

    if (!estimationTask.negotiator.estimatedHours) {
        estimationTask.negotiator.estimatedHours = 0
    }
    if (!estimationTask.estimator.estimatedHours) {
        estimationTask.estimator.estimatedHours = 0
    }

    let estimation = await EstimationModel.findById(estimationTask.estimation._id)
    if (!estimation)
        throw new AppError('Estimation not found', EC.NOT_FOUND, EC.HTTP_BAD_REQUEST)

    if (estimator._id.toString() != estimation.estimator._id.toString())
        throw new AppError('Invalid task for this estimation', EC.NOT_FOUND, EC.HTTP_BAD_REQUEST)

    if (!_.includes([SC.STATUS_ESTIMATION_REQUESTED, SC.STATUS_CHANGE_REQUESTED], estimation.status))
        throw new AppError("Estimation has status as [" + estimation.status + "]. Estimator can only update task into those estimations where status is in [" + SC.STATUS_ESTIMATION_REQUESTED + ", " + SC.STATUS_CHANGE_REQUESTED + "]", EC.INVALID_OPERATION, EC.HTTP_BAD_REQUEST)

    if (taskInput.repo && !taskInput.repo.addedFromThisEstimation)
        throw new AppError('Task is From Repository ', EC.TASK_FROM_REPOSITORY_ERROR)

    if (estimationTask.feature && estimationTask.feature._id) {
        let estimationFeatureObj = await EstimationFeatureModel.findById(estimationTask.feature._id)
        if (!estimationFeatureObj)
            throw new AppError('Feature not found', EC.NOT_FOUND, EC.HTTP_BAD_REQUEST)

        if (estimation._id.toString() != estimationFeatureObj.estimation._id.toString())
            throw new AppError('Feature not found for this estimation', EC.NOT_FOUND, EC.HTTP_BAD_REQUEST)

        if ((await EstimationTaskModel.count({
                "hasError": true,
                "isDeleted": false,
                "feature._id": estimationFeatureObj._id,
                "estimation._id": estimation._id
            }) + estimationTask.hasError ? (-1) : 0 )> 0
                || (!taskInput.estimatedHours || taskInput.estimatedHours == 0)
                || _.isEmpty(taskInput.name)
                || _.isEmpty(taskInput.description)
                || _.isEmpty(estimationFeatureObj.estimator.name)
                || _.isEmpty(estimationFeatureObj.estimator.description)
                || (estimationFeatureObj.estimator.estimatedHours - taskInput.estimatedHours) <= 0) {
            console.log("has error true", true)
            console.log("has error true@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@", estimationTask.hasError)
            console.log("estimationTask.estimator.estimatedHours", estimationTask.estimator.estimatedHours, "estimationTask.estimator.estimatedHours", estimationTask.estimator.estimatedHours)

            await EstimationFeatureModel.updateOne({_id: estimationTask.feature._id}, {
                $inc: {"estimator.estimatedHours": estimationTask.estimator.estimatedHours ? (taskInput.estimatedHours - estimationTask.estimator.estimatedHours) : taskInput.estimatedHours},
                "canApprove": false,
                "estimator.changedInThisIteration": true,
                "hasError": true
            })
        } else {
            console.log("has error true", false)
            console.log("estimationTask.estimator.estimatedHours", estimationTask.estimator.estimatedHours, "estimationTask.estimator.estimatedHours", estimationTask.estimator.estimatedHours)
            await EstimationFeatureModel.updateOne({_id: estimationTask.feature._id}, {
                $inc: {"estimator.estimatedHours": estimationTask.estimator.estimatedHours ? (estimationTask.estimator.estimatedHours - estimationTask.estimator.estimatedHours) : taskInput.estimatedHours},
                "canApprove": false,
                "estimator.changedInThisIteration": true,
                "hasError": false
            })
        }


    }

    if (estimation && estimation._id) {

        let errorTaskCount = await EstimationTaskModel.count({
            "estimation._id": estimation._id,
            "isDeleted": false,
            "hasError": true
        })
        let errorFeatureCount = await EstimationFeatureModel.count({
            "estimation._id": estimation._id,
            "isDeleted": false,
            "hasError": true
        })
        console.log("errorTaskCount", errorTaskCount)
        console.log("errorFeatureCount", errorFeatureCount)

        console.log("Inside estimation Update")
        let bk1 = await EstimationModel.updateOne({_id: estimation._id}, {
            $inc: {"estimatedHours": estimationTask.estimator.estimatedHours ? taskInput.estimatedHours - estimationTask.estimator.estimatedHours : taskInput.estimatedHours},
            "hasError": (errorTaskCount > 0 || errorFeatureCount > 0) ? true : false
        })
        console.log("bk1", bk1)
    }

    if (estimationTask.repo && estimationTask.repo._id) {
        // find repo and update when task is updating
        let repositoryTask = await
            RepositoryModel.updateTask(estimationTask.repo._id, taskInput, estimator)
    }

    estimationTask.feature = taskInput.feature ? taskInput.feature : estimationTask.feature ? estimationTask.feature : undefined
    estimationTask.estimator.name = taskInput.name
    estimationTask.estimator.description = taskInput.description
    estimationTask.estimator.estimatedHours = taskInput.estimatedHours
    estimationTask.canApprove = false
    estimationTask.hasError = false

    if ((!estimationTask.estimator.estimatedHours || estimationTask.estimator.estimatedHours == 0)
        || _.isEmpty(estimationTask.estimator.name)
        || _.isEmpty(estimationTask.estimator.description)) {
        estimationTask.hasError = true
    } else estimationTask.hasError = false

    if (!estimationTask.addedInThisIteration || estimationTask.owner != SC.OWNER_ESTIMATOR) {
        estimationTask.estimator.changedInThisIteration = true
        estimationTask.estimator.changedKeyInformation = true
    }

    estimationTask.updated = Date.now()

    if (!_.isEmpty(taskInput.notes)) {
        taskInput.notes = taskInput.notes.map(n => {
            n.name = estimator.fullName
            return n
        })
    }

    let mergeAllNotes = []
    if (!_.isEmpty(estimationTask.notes)) {
        mergeAllNotes = estimationTask.notes
        taskInput.notes.map(n => {
            mergeAllNotes.push(n)
        })
    } else {
        mergeAllNotes = taskInput.notes
    }
    estimationTask.notes = mergeAllNotes
    return await estimationTask.save()

}

// updating task by Negotiator
const updateTaskByNegotiator = async (taskInput, negotiator) => {
    V.validate(taskInput, V.estimationNegotiatorUpdateTaskStruct)
    let estimationFeatureObj
    if (!negotiator || !userHasRole(negotiator, SC.ROLE_NEGOTIATOR))
        throw new AppError('Not an negotiator', EC.INVALID_USER, EC.HTTP_BAD_REQUEST)

    let estimationTask = await EstimationTaskModel.findById(taskInput._id)
    if (!estimationTask)
        throw new AppError('Estimation task not found', EC.NOT_FOUND, EC.HTTP_BAD_REQUEST)

    let estimation = await EstimationModel.findById(estimationTask.estimation._id)
    if (!estimation)
        throw new AppError('Estimation not found', EC.NOT_FOUND, EC.HTTP_BAD_REQUEST)

    if (negotiator._id.toString() != estimation.negotiator._id.toString())
        throw new AppError('Invalid task for this estimation', EC.NOT_FOUND, EC.HTTP_BAD_REQUEST)

    if (taskInput.repo && !taskInput.repo.addedFromThisEstimation)
        throw new AppError('Task is From Repository ', EC.TASK_FROM_REPOSITORY_ERROR)

    if (!_.includes([SC.STATUS_INITIATED, SC.STATUS_REVIEW_REQUESTED], estimation.status))
        throw new AppError("Estimation has status as [" + estimation.status + "]. Negotiator can only update task into those estimations where status is in [" + SC.STATUS_INITIATED + "," + SC.STATUS_REVIEW_REQUESTED + "]", EC.INVALID_OPERATION, EC.HTTP_BAD_REQUEST)

    if (estimationTask.feature && estimationTask.feature._id) {
        estimationFeatureObj = await EstimationFeatureModel.findById(estimationTask.feature._id)
        if (!estimationFeatureObj)
            throw new AppError('Feature not found', EC.NOT_FOUND, EC.HTTP_BAD_REQUEST)

        if (estimation._id.toString() != estimationFeatureObj.estimation._id.toString())
            throw new AppError('Feature not found for this estimation', EC.NOT_FOUND, EC.HTTP_BAD_REQUEST)

        await EstimationFeatureModel.updateOne({_id: estimationTask.feature._id}, {
            $inc: {"negotiator.estimatedHours": estimationTask.negotiator.estimatedHours ? taskInput.estimatedHours - estimationTask.negotiator.estimatedHours : taskInput.estimatedHours},
            "canApprove": false,
            "negotiator.changedInThisIteration": true
        })
    }
    if (estimation && estimation._id) {
        await EstimationModel.updateOne({_id: estimation._id}, {
            $inc: {"suggestedHours": estimationTask.negotiator.estimatedHours ? taskInput.estimatedHours - estimationTask.negotiator.estimatedHours : taskInput.estimatedHours}
        })
    }


    estimationTask.feature = taskInput.feature ? taskInput.feature : estimationTask.feature ? estimationTask.feature : undefined
    estimationTask.negotiator.name = taskInput.name
    estimationTask.canApprove = false
    estimationTask.negotiator.description = taskInput.description
    estimationTask.negotiator.estimatedHours = taskInput.estimatedHours
    if (!estimationTask.addedInThisIteration || estimationTask.owner != SC.OWNER_NEGOTIATOR)
        estimationTask.negotiator.changedInThisIteration = true
    estimationTask.negotiator.changeSuggested = true
    if (!estimationTask.estimator.estimatedHours) {
        estimationTask.estimator.estimatedHours = 0
    }
    estimationTask.updated = Date.now()

    if (!_.isEmpty(taskInput.notes)) {
        taskInput.notes = taskInput.notes.map(n => {
            n.name = negotiator.fullName
            return n
        })
    }

    let mergeAllNotes = []
    if (!_.isEmpty(estimationTask.notes)) {
        mergeAllNotes = estimationTask.notes
        taskInput.notes.map(n => {
            mergeAllNotes.push(n)
        })
    } else {
        mergeAllNotes = taskInput.notes
    }
    estimationTask.notes = mergeAllNotes
    await estimationTask.save()
    estimationTask = estimationTask.toObject()
    if (estimationFeatureObj && estimationFeatureObj.canApprove) {
        estimationTask.isFeatureCanApprove = true
    }
    if (estimation && estimation.canApprove) {
        estimationTask.isEstimationCanApprove = true
    }
    return estimationTask
}

// move task to feature
estimationTaskSchema.statics.moveTaskToFeature = async (taskID, featureID, user) => {
    let task = await EstimationTaskModel.findById(taskID)
    if (!task)
        throw new AppError('Task not found', EC.NOT_FOUND, EC.HTTP_BAD_REQUEST)


    let feature = await EstimationFeatureModel.findById(featureID)
    if (!feature)
        throw new AppError('Feature not found', EC.NOT_FOUND, EC.HTTP_BAD_REQUEST)


    if (!task.estimation || !task.estimation._id)
        throw new AppError('Estimation Identifier required at [estimation._id]', EC.NOT_FOUND, EC.HTTP_BAD_REQUEST)

    let estimation = await EstimationModel.findOne({"_id": feature.estimation._id})
    if (!estimation)
        throw new AppError('Estimation not found', EC.NOT_FOUND, EC.HTTP_BAD_REQUEST)


    let role = await EstimationModel.getUserRoleInEstimation(task.estimation._id, user)
    if (role === SC.ROLE_ESTIMATOR) {

        return await moveTaskToFeatureByEstimator(task, feature, estimation, user)
    } else if (role === SC.ROLE_NEGOTIATOR) {

        return await moveTaskToFeatureByNegotiator(task, feature, estimation, user)
    }
    throw new AppError('You play no role in this estimation', EC.INVALID_USER, EC.HTTP_BAD_REQUEST)
}


// move task to feature by Estimator
const moveTaskToFeatureByEstimator = async (task, feature, estimation, estimator) => {


    if (!_.includes([SC.STATUS_ESTIMATION_REQUESTED, SC.STATUS_CHANGE_REQUESTED], estimation.status))
        throw new AppError("Estimation has status as [" + estimation.status + "]. Estimator can only move task to feature into those estimations where status is in [" + SC.STATUS_ESTIMATION_REQUESTED + ", " + SC.STATUS_CHANGE_REQUESTED + "]", EC.INVALID_OPERATION, EC.HTTP_BAD_REQUEST)

    if (feature.status === SC.STATUS_APPROVED) {
        throw new AppError('Task can not be moved as feature is already approved', EC.MOVE_TASK_IN_FEATURE_ERROR, EC.HTTP_BAD_REQUEST)
    }
    // As task is being moved to feature, estimated hours and suggested hours of this task would be added into estimated hours of feature (only if estimator.estimatedHours has value

    if (task.estimator.estimatedHours && task.negotiator.estimatedHours) {
        // As task is moved we have to check for has error in feature including this task
        if (await EstimationTaskModel.count({
                "hasError": true,
                "isDeleted": false,
                "feature._id": feature._id,
                "estimation._id": estimation._id
            }) + task.hasError ? (+1) : 0 > 0
                || _.isEmpty(feature.estimator.name)
                || _.isEmpty(feature.estimator.description)
                || (feature.estimator.estimatedHours + task.estimator.estimatedHours) <= 0) {
            //there is still error after including this task
            await EstimationFeatureModel.updateOne({_id: feature._id}, {
                $inc: {
                    "estimator.estimatedHours": task.estimator.estimatedHours,
                    "negotiator.estimatedHours": task.negotiator.estimatedHours
                },
                "canApprove": false,
                "hasError": true
            })

        } else {
            //there is no error after including this task
            await EstimationFeatureModel.updateOne({_id: feature._id}, {
                $inc: {
                    "estimator.estimatedHours": task.estimator.estimatedHours,
                    "negotiator.estimatedHours": task.negotiator.estimatedHours
                },
                "canApprove": false,
                "hasError": false
            })
        }

    } else if (task.estimator.estimatedHours) {
        //only estimated hours is there in this task
        // As task is included we have to check for has error in feature including this task
        if (await EstimationTaskModel.count({
                "hasError": true,
                "isDeleted": false,
                "feature._id": feature._id,
                "estimation._id": estimation._id
            }) + task.hasError ? (+1) : 0 > 0
                || _.isEmpty(feature.estimator.name)
                || _.isEmpty(feature.estimator.description)
                || (feature.estimator.estimatedHours + task.estimator.estimatedHours) <= 0) {
            //there is still error after including this task
            await EstimationFeatureModel.updateOne({_id: feature._id}, {
                $inc: {"estimator.estimatedHours": task.estimator.estimatedHours},
                "canApprove": false,
                "hasError": true
            })
        } else {
            //there is no error after including this task
            await EstimationFeatureModel.updateOne({_id: feature._id}, {
                $inc: {"estimator.estimatedHours": task.estimator.estimatedHours},
                "canApprove": false,
                "hasError": false
            })
        }


    } else if (task.negotiator.estimatedHours) {

        //only suggested hours is there in this task
        // As task is included we have to check for has error in feature including this task
        if (await EstimationTaskModel.count({
                "hasError": true,
                "isDeleted": false,
                "feature._id": feature._id,
                "estimation._id": estimation._id
            }) + task.hasError ? (+1) : 0 > 0
                || _.isEmpty(feature.estimator.name)
                || _.isEmpty(feature.estimator.description)
                || (feature.estimator.estimatedHours + task.estimator.estimatedHours) <= 0) {

            //there is still error after including this task
            await EstimationFeatureModel.updateOne({_id: feature._id}, {
                $inc: {"negotiator.estimatedHours": task.negotiator.estimatedHours},
                "canApprove": false,
                "hasError": true
            })
        } else {
            //there is no error after including this task
            await EstimationFeatureModel.updateOne({_id: feature._id}, {
                $inc: {"negotiator.estimatedHours": task.negotiator.estimatedHours},
                "canApprove": false,
                "hasError": false
            })
        }

    }

    // As task is moved do not update repository to note this change

    // moved out by negotiator then clear its flag while move in to feature by estimator
    if (task.negotiator.isMovedOutOfFeature && task.negotiator.changedInThisIteration) {
        task.negotiator.isMovedOutOfFeature = false
        task.negotiator.changedInThisIteration = false
    }
    task.feature = feature
    task.canApprove = false
    task.updated = Date.now()
    if (!task.addedInThisIteration || task.owner != SC.OWNER_ESTIMATOR)
        task.estimator.changedInThisIteration = true
    task.estimator.isMovedToFeature = true
    task.estimator.isMovedOutOfFeature = false
    return await task.save()
}


// move task to feature by Negotiator
const moveTaskToFeatureByNegotiator = async (task, feature, estimation, negotiator) => {

    if (!_.includes([SC.STATUS_INITIATED, SC.STATUS_REVIEW_REQUESTED], estimation.status))
        throw new AppError("Estimation has status as [" + estimation.status + "]. Negotiator can only move task to feature into those estimations where status is in [" + SC.STATUS_INITIATED + ", " + SC.STATUS_REVIEW_REQUESTED + "]", EC.INVALID_OPERATION, EC.HTTP_BAD_REQUEST)


    if (feature.status === SC.STATUS_APPROVED) {
        throw new AppError('task cant be moved as it is already approved', EC.MOVE_TASK_IN_FEATURE_ERROR, EC.HTTP_BAD_REQUEST)
    }
    // As task is being moved to feature, estimated hours of this task would be added into estimated hours of feature (only if estimator.estimatedHours has value


    if (task.estimator.estimatedHours && task.negotiator.estimatedHours) {
        // As task is moved we have to check for has error in feature including this task
        if (await EstimationTaskModel.count({
                "hasError": true,
                "isDeleted": false,
                "feature._id": feature._id,
                "estimation._id": estimation._id
            }) + task.hasError ? (+1) : 0 > 0
                || _.isEmpty(feature.estimator.name)
                || _.isEmpty(feature.estimator.description)
                || (feature.estimator.estimatedHours + task.estimator.estimatedHours) <= 0) {
            //there is still error after including this task
            await EstimationFeatureModel.updateOne({_id: feature._id}, {
                $inc: {
                    "estimator.estimatedHours": task.estimator.estimatedHours,
                    "negotiator.estimatedHours": task.negotiator.estimatedHours
                },
                "canApprove": false,
                "hasError": true
            })

        } else {
            //there is no error after including this task
            await EstimationFeatureModel.updateOne({_id: feature._id}, {
                $inc: {
                    "estimator.estimatedHours": task.estimator.estimatedHours,
                    "negotiator.estimatedHours": task.negotiator.estimatedHours
                },
                "canApprove": false,
                "hasError": false
            })
        }

    } else if (task.estimator.estimatedHours) {
        //only estimated hours is there in this task
        // As task is included we have to check for has error in feature including this task
        if (await EstimationTaskModel.count({
                "hasError": true,
                "isDeleted": false,
                "feature._id": feature._id,
                "estimation._id": estimation._id
            }) + task.hasError ? (+1) : 0 > 0
                || _.isEmpty(feature.estimator.name)
                || _.isEmpty(feature.estimator.description)
                || (feature.estimator.estimatedHours + task.estimator.estimatedHours) <= 0) {
            //there is still error after including this task
            await EstimationFeatureModel.updateOne({_id: feature._id}, {
                $inc: {"estimator.estimatedHours": task.estimator.estimatedHours},
                "canApprove": false,
                "hasError": true
            })
        } else {
            //there is no error after including this task
            await EstimationFeatureModel.updateOne({_id: feature._id}, {
                $inc: {"estimator.estimatedHours": task.estimator.estimatedHours},
                "canApprove": false,
                "hasError": false
            })
        }


    } else if (task.negotiator.estimatedHours) {

        //only suggested hours is there in this task
        // As task is included we have to check for has error in feature including this task
        if (await EstimationTaskModel.count({
                "hasError": true,
                "isDeleted": false,
                "feature._id": feature._id,
                "estimation._id": estimation._id
            }) + task.hasError ? (+1) : 0 > 0
                || _.isEmpty(feature.estimator.name)
                || _.isEmpty(feature.estimator.description)
                || (feature.estimator.estimatedHours + task.estimator.estimatedHours) <= 0) {

            //there is still error after including this task
            await EstimationFeatureModel.updateOne({_id: feature._id}, {
                $inc: {"negotiator.estimatedHours": task.negotiator.estimatedHours},
                "canApprove": false,
                "hasError": true
            })
        } else {
            //there is no error after including this task
            await EstimationFeatureModel.updateOne({_id: feature._id}, {
                $inc: {"negotiator.estimatedHours": task.negotiator.estimatedHours},
                "canApprove": false,
                "hasError": false
            })
        }

    }


    // moved out by estimator then clear its flag while move in to feature by negotiator
    if (task.estimator.isMovedOutOfFeature && task.estimator.changedInThisIteration) {
        task.estimator.isMovedOutOfFeature = false
        task.estimator.changedInThisIteration = false
    }
    task.feature = feature
    task.updated = Date.now()
    if (!task.addedInThisIteration || task.owner != SC.OWNER_NEGOTIATOR)
        task.negotiator.changedInThisIteration = true
    task.negotiator.isMovedToFeature = true
    task.negotiator.isMovedOutOfFeature = false
    return await task.save()
}


// move task out of feature
estimationTaskSchema.statics.moveTaskOutOfFeature = async (taskID, user) => {
    let task = await EstimationTaskModel.findById(taskID)
    if (!task)
        throw new AppError('Task not found', EC.NOT_FOUND, EC.HTTP_BAD_REQUEST)


    if (!task.estimation || !task.estimation._id)
        throw new AppError('Estimation Identifier required at [estimation._id]', EC.NOT_FOUND, EC.HTTP_BAD_REQUEST)

    let estimation = await EstimationModel.findOne({"_id": task.estimation._id})
    if (!estimation)
        throw new AppError('Estimation not found', EC.NOT_FOUND, EC.HTTP_BAD_REQUEST)


    let role = await EstimationModel.getUserRoleInEstimation(task.estimation._id, user)
    if (role === SC.ROLE_ESTIMATOR) {

        return await moveTaskOutOfFeatureByEstimator(task, estimation, user)
    } else if (role === SC.ROLE_NEGOTIATOR) {

        return await moveTaskOutOfFeatureByNegotiator(task, estimation, user)
    }
    throw new AppError('You play no role in this estimation', EC.INVALID_USER, EC.HTTP_BAD_REQUEST)
}

// move task out of feature by estimator
const moveTaskOutOfFeatureByEstimator = async (task, estimation, estimator) => {

    let feature = await EstimationFeatureModel.findById(task.feature._id)

    if (!_.includes([SC.STATUS_ESTIMATION_REQUESTED, SC.STATUS_CHANGE_REQUESTED], estimation.status))
        throw new AppError("Estimation has status as [" + estimation.status + "]. Estimator can only update feature(Move task out of Feature) into those estimations where status is in [" + SC.STATUS_ESTIMATION_REQUESTED + ", " + SC.STATUS_CHANGE_REQUESTED + "]", EC.INVALID_OPERATION, EC.HTTP_BAD_REQUEST)

    if (!estimation.estimator._id == estimator._id)
        throw new AppError('Not an estimator', EC.INVALID_USER, EC.HTTP_BAD_REQUEST)


    // As task is moved out of feature we would have to subtract hours ($inc with minus) of this task from overall estimated hours of feature

    if (task.estimator.estimatedHours && task.negotiator.estimatedHours) {
        // As task is moved out of feature we have to check for has error in feature excluding this task
        if (await EstimationTaskModel.count({
                "hasError": true,
                "isDeleted": false,
                "feature._id": feature._id,
                "estimation._id": estimation._id
            }) + task.hasError ? (-1) : 0 > 0
                || _.isEmpty(feature.estimator.name)
                || _.isEmpty(feature.estimator.description)
                || (feature.estimator.estimatedHours - task.estimator.estimatedHours) <= 0) {
            //there is still error after excluding this task
            await EstimationFeatureModel.updateOne({_id: feature._id}, {
                $inc: {
                    "estimator.estimatedHours": -task.estimator.estimatedHours,
                    "negotiator.estimatedHours": -task.negotiator.estimatedHours
                },
                "canApprove": false,
                "hasError": true
            })

        } else {
            //there is no error after excluding this task
            await EstimationFeatureModel.updateOne({_id: feature._id}, {
                $inc: {
                    "estimator.estimatedHours": -task.estimator.estimatedHours,
                    "negotiator.estimatedHours": -task.negotiator.estimatedHours
                },
                "canApprove": false,
                "hasError": false
            })
        }

    } else if (task.estimator.estimatedHours) {
        //only estimated hours is there in this task
        // As task is excluded we have to check for has error in feature excluding this task
        if (await EstimationTaskModel.count({
                "hasError": true,
                "isDeleted": false,
                "feature._id": feature._id,
                "estimation._id": estimation._id
            }) + task.hasError ? (-1) : 0 > 0
                || _.isEmpty(feature.estimator.name)
                || _.isEmpty(feature.estimator.description)
                || (feature.estimator.estimatedHours - task.estimator.estimatedHours) <= 0) {
            //there is still error after excluding this task
            await EstimationFeatureModel.updateOne({_id: feature._id}, {
                $inc: {"estimator.estimatedHours": -task.estimator.estimatedHours},
                "canApprove": false,
                "hasError": true
            })
        } else {
            //there is no error after excluding this task
            await EstimationFeatureModel.updateOne({_id: feature._id}, {
                $inc: {"estimator.estimatedHours": -task.estimator.estimatedHours},
                "canApprove": false,
                "hasError": false
            })
        }


    } else if (task.negotiator.estimatedHours) {

        //only suggested hours is there in this task
        // As task is excluded we have to check for has error in feature excluding this task
        if (await EstimationTaskModel.count({
                "hasError": true,
                "isDeleted": false,
                "feature._id": feature._id,
                "estimation._id": estimation._id
            }) + task.hasError ? (-1) : 0 > 0
                || _.isEmpty(feature.estimator.name)
                || _.isEmpty(feature.estimator.description)
                || (feature.estimator.estimatedHours - task.estimator.estimatedHours) <= 0) {

            //there is still error after excluding this task
            await EstimationFeatureModel.updateOne({_id: feature._id}, {
                $inc: {"negotiator.estimatedHours": -task.negotiator.estimatedHours},
                "canApprove": false,
                "hasError": true
            })
        } else {
            //there is no error after excluding this task
            await EstimationFeatureModel.updateOne({_id: feature._id}, {
                $inc: {"negotiator.estimatedHours": -task.negotiator.estimatedHours},
                "canApprove": false,
                "hasError": false
            })
        }

    }

    // moved in by negotiator  then clear its flag while move out to feature by estimator
    if (task.negotiator.isMovedToFeature && task.negotiator.changedInThisIteration) {
        task.negotiator.isMovedToFeature = false
        task.negotiator.changedInThisIteration = false
    }
    task.feature = null
    task.updated = Date.now()
    task.estimator.isMovedToFeature = false
    task.estimator.isMovedOutOfFeature = true
    if (!task.addedInThisIteration || task.owner != SC.OWNER_ESTIMATOR)
        task.estimator.changedInThisIteration = true
    return await task.save()
}

// move task out of feature by negotiator
const moveTaskOutOfFeatureByNegotiator = async (task, estimation, negotiator) => {

    let feature = await EstimationFeatureModel.findById(task.feature._id)
    if (!feature)
        throw new AppError('Feature not found', EC.NOT_FOUND, EC.HTTP_BAD_REQUEST)

    if (!_.includes([SC.STATUS_INITIATED, SC.STATUS_REVIEW_REQUESTED], estimation.status))
        throw new AppError("Estimation has status as [" + estimation.status + "]. Negotiator can only update feature(Move task out of feature) into those estimations where status is in [" + SC.STATUS_INITIATED + ", " + SC.STATUS_REVIEW_REQUESTED + "]", EC.INVALID_OPERATION, EC.HTTP_BAD_REQUEST)

    if (!estimation.negotiator._id == negotiator._id)
        throw new AppError('Not an negotiator', EC.INVALID_USER, EC.HTTP_BAD_REQUEST)

    // As task is moved out of feature we would have to subtract hours ($inc with minus) of this task from overall estimated hours of feature


    if (task.estimator.estimatedHours && task.negotiator.estimatedHours) {
        // As task is moved out of feature we have to check for has error in feature excluding this task
        if (await EstimationTaskModel.count({
                "hasError": true,
                "isDeleted": false,
                "feature._id": feature._id,
                "estimation._id": estimation._id
            }) + task.hasError ? (-1) : 0 > 0
                || _.isEmpty(feature.estimator.name)
                || _.isEmpty(feature.estimator.description)
                || (feature.estimator.estimatedHours - task.estimator.estimatedHours) <= 0) {
            //there is still error after excluding this task
            await EstimationFeatureModel.updateOne({_id: feature._id}, {
                $inc: {
                    "estimator.estimatedHours": -task.estimator.estimatedHours,
                    "negotiator.estimatedHours": -task.negotiator.estimatedHours
                },
                "canApprove": false,
                "hasError": true
            })

        } else {
            //there is no error after excluding this task
            await EstimationFeatureModel.updateOne({_id: feature._id}, {
                $inc: {
                    "estimator.estimatedHours": -task.estimator.estimatedHours,
                    "negotiator.estimatedHours": -task.negotiator.estimatedHours
                },
                "canApprove": false,
                "hasError": false
            })
        }

    } else if (task.estimator.estimatedHours) {
        //only estimated hours is there in this task
        // As task is excluded we have to check for has error in feature excluding this task
        if (await EstimationTaskModel.count({
                "hasError": true,
                "isDeleted": false,
                "feature._id": feature._id,
                "estimation._id": estimation._id
            }) + task.hasError ? (-1) : 0 > 0
                || _.isEmpty(feature.estimator.name)
                || _.isEmpty(feature.estimator.description)
                || (feature.estimator.estimatedHours - task.estimator.estimatedHours) <= 0) {
            //there is still error after excluding this task
            await EstimationFeatureModel.updateOne({_id: feature._id}, {
                $inc: {"estimator.estimatedHours": -task.estimator.estimatedHours},
                "canApprove": false,
                "hasError": true
            })
        } else {
            //there is no error after excluding this task
            await EstimationFeatureModel.updateOne({_id: feature._id}, {
                $inc: {"estimator.estimatedHours": -task.estimator.estimatedHours},
                "canApprove": false,
                "hasError": false
            })
        }


    } else if (task.negotiator.estimatedHours) {

        //only suggested hours is there in this task
        // As task is excluded we have to check for has error in feature excluding this task
        if (await EstimationTaskModel.count({
                "hasError": true,
                "isDeleted": false,
                "feature._id": feature._id,
                "estimation._id": estimation._id
            }) + task.hasError ? (-1) : 0 > 0
                || _.isEmpty(feature.estimator.name)
                || _.isEmpty(feature.estimator.description)
                || (feature.estimator.estimatedHours - task.estimator.estimatedHours) <= 0) {

            //there is still error after excluding this task
            await EstimationFeatureModel.updateOne({_id: feature._id}, {
                $inc: {"negotiator.estimatedHours": -task.negotiator.estimatedHours},
                "canApprove": false,
                "hasError": true
            })
        } else {
            //there is no error after excluding this task
            await EstimationFeatureModel.updateOne({_id: feature._id}, {
                $inc: {"negotiator.estimatedHours": -task.negotiator.estimatedHours},
                "canApprove": false,
                "hasError": false
            })
        }

    }


    // moved in by estimator then clear its flag while move out to feature by negotiator
    if (task.estimator.isMovedToFeature && task.estimator.changedInThisIteration) {
        task.estimator.isMovedToFeature = false
        task.estimator.changedInThisIteration = false
    }

    task.feature = null
    task.updated = Date.now()
    task.negotiator.isMovedToFeature = false
    task.negotiator.isMovedOutOfFeature = true
    if (!task.addedInThisIteration || task.owner != SC.OWNER_NEGOTIATOR)
        task.negotiator.changedInThisIteration = true
    return await task.save()
}


// request removal task
estimationTaskSchema.statics.requestRemovalTask = async (taskID, user) => {
    let task = await EstimationTaskModel.findById(taskID)
    if (!task)
        throw new AppError('Task not found', EC.NOT_FOUND, EC.HTTP_BAD_REQUEST)


    if (!task.estimation || !task.estimation._id)
        throw new AppError('Estimation Identifier required at [estimation._id]', EC.NOT_FOUND, EC.HTTP_BAD_REQUEST)

    let estimation = await EstimationModel.findOne({"_id": task.estimation._id})
    if (!estimation)
        throw new AppError('Estimation not found', EC.NOT_FOUND, EC.HTTP_BAD_REQUEST)


    let role = await EstimationModel.getUserRoleInEstimation(estimation._id, user)
    if (role === SC.ROLE_ESTIMATOR) {

        return await requestRemovalTaskByEstimator(task, estimation, user)
    } else if (role === SC.ROLE_NEGOTIATOR) {
        throw new AppError("Only users with role [" + SC.ROLE_ESTIMATOR + "] can request removal task into estimation", EC.ACCESS_DENIED, EC.HTTP_FORBIDDEN)
    }
    throw new AppError('You play no role in this estimation', EC.INVALID_USER, EC.HTTP_BAD_REQUEST)
}

// request removal task by estimator
const requestRemovalTaskByEstimator = async (task, estimation, estimator) => {

    if (!_.includes([SC.STATUS_ESTIMATION_REQUESTED, SC.STATUS_CHANGE_REQUESTED], estimation.status))
        throw new AppError("Estimation has status as [" + estimation.status + "]. Estimator can only update removal task flag into those estimations where status is in [" + SC.STATUS_ESTIMATION_REQUESTED + ", " + SC.STATUS_CHANGE_REQUESTED + "]", EC.INVALID_OPERATION, EC.HTTP_BAD_REQUEST)

    if (!estimation.estimator._id == estimator._id)
        throw new AppError('Not an estimator', EC.INVALID_USER, EC.HTTP_BAD_REQUEST)
    if (task && task.feature && task.feature._id) {
        await EstimationFeatureModel.updateOne({_id: task.feature._id}, {
            $set: {"estimator.requestedInThisIteration": true}
        })
    }

    task.estimator.removalRequested = !task.estimator.removalRequested
    task.estimator.changedInThisIteration = true

    return await task.save()
}

// request re-open task
estimationTaskSchema.statics.requestReOpenPermissionOfTask = async (taskID, user) => {
    let task = await EstimationTaskModel.findById(taskID)
    if (!task)
        throw new AppError('Task not found', EC.NOT_FOUND, EC.HTTP_BAD_REQUEST)


    if (!task.estimation || !task.estimation._id)
        throw new AppError('Estimation Identifier required at [estimation._id]', EC.NOT_FOUND, EC.HTTP_BAD_REQUEST)

    let estimation = await EstimationModel.findOne({"_id": task.estimation._id})
    if (!estimation)
        throw new AppError('Estimation not found', EC.NOT_FOUND, EC.HTTP_BAD_REQUEST)


    let role = await EstimationModel.getUserRoleInEstimation(estimation._id, user)
    if (role === SC.ROLE_ESTIMATOR) {

        return await requestReOpenPermissionOfTaskByEstimator(task, estimation, user)
    } else if (role === SC.ROLE_NEGOTIATOR) {
        throw new AppError("Only users with role [" + SC.ROLE_ESTIMATOR + "] can request re-open task into estimation", EC.ACCESS_DENIED, EC.HTTP_FORBIDDEN)
    }
    throw new AppError('You play no role in this estimation', EC.INVALID_USER, EC.HTTP_BAD_REQUEST)
}


// request re-open task by estimator
const requestReOpenPermissionOfTaskByEstimator = async (task, estimation, estimator) => {

    if (!_.includes([SC.STATUS_ESTIMATION_REQUESTED, SC.STATUS_CHANGE_REQUESTED], estimation.status))
        throw new AppError("Estimation has status as [" + estimation.status + "]. Estimator can only request edit task into those estimations where status is in [" + SC.STATUS_ESTIMATION_REQUESTED + ", " + SC.STATUS_CHANGE_REQUESTED + "]", EC.INVALID_OPERATION, EC.HTTP_BAD_REQUEST)

    if (!estimation.estimator._id == estimator._id)
        throw new AppError('Not an estimator', EC.INVALID_USER, EC.HTTP_BAD_REQUEST)

    if (task && task.feature && task.feature._id) {
        await EstimationFeatureModel.updateOne({_id: task.feature._id}, {
            $set: {"estimator.requestedInThisIteration": true},
            "canApprove": false
        })
    }

    task.estimator.changeRequested = !task.estimator.changeRequested
    task.estimator.changedInThisIteration = true
    task.canApprove = false

    return await task.save()
}

// delete task
estimationTaskSchema.statics.deleteTask = async (taskID, estimationID, user) => {
    let task = await EstimationTaskModel.findById(taskID)
    if (!task)
        throw new AppError('Task not found', EC.NOT_FOUND, EC.HTTP_BAD_REQUEST)


    if (!task.estimation || !task.estimation._id)
        throw new AppError('Estimation Identifier required at [estimation._id]', EC.NOT_FOUND, EC.HTTP_BAD_REQUEST)

    let estimation = await EstimationModel.findOne({"_id": estimationID})
    if (!estimation)
        throw new AppError('Estimation not found', EC.NOT_FOUND, EC.HTTP_BAD_REQUEST)


    let role = await EstimationModel.getUserRoleInEstimation(estimation._id, user)
    if (role === SC.ROLE_ESTIMATOR) {

        return await deleteTaskByEstimator(task, estimation, user)
    } else if (role === SC.ROLE_NEGOTIATOR) {
        return await deleteTaskByNegotiator(task, estimation, user)
    }
    throw new AppError('You play no role in this estimation', EC.INVALID_USER, EC.HTTP_BAD_REQUEST)
}

// delete task by estimator
const deleteTaskByEstimator = async (task, estimation, estimator) => {

    if (estimation.estimator._id != estimator._id)
        throw new AppError('Not an estimator', EC.INVALID_USER, EC.HTTP_BAD_REQUEST)

    if (!task.addedInThisIteration)
        throw new AppError('You are not allowed to delete this task', EC.ACCESS_DENIED, EC.HTTP_BAD_REQUEST)

    if (task.feature && task.feature._id) {
        let feature = await EstimationFeatureModel.findById(task.feature._id)
        if (!feature)
            throw new AppError('Feature that this task is associated with is not found', EC.NOT_FOUND, EC.HTTP_BAD_REQUEST)

        // As task is removed we have to subtract hours ($inc with minus) of this task from overall estimated hours of feature

        if (task.estimator.estimatedHours && task.negotiator.estimatedHours) {
            // As task is removed we have to check for has error in feature except deleting task
            if (await EstimationTaskModel.count({
                    "hasError": true,
                    "isDeleted": false,
                    "feature._id": feature._id,
                    "estimation._id": estimation._id
                }) + task.hasError ? (-1) : 0 > 0
                    || _.isEmpty(feature.estimator.name)
                    || _.isEmpty(feature.estimator.description)
                    || (feature.estimator.estimatedHours - task.estimator.estimatedHours) <= 0) {
                //there is still error after deleting this task
                await EstimationFeatureModel.updateOne({_id: feature._id}, {
                    $inc: {
                        "estimator.estimatedHours": -task.estimator.estimatedHours,
                        "negotiator.estimatedHours": -task.negotiator.estimatedHours
                    },
                    "canApprove": false,
                    "hasError": true
                })

            } else {
                //there is no error after deleting this task
                await EstimationFeatureModel.updateOne({_id: feature._id}, {
                    $inc: {
                        "estimator.estimatedHours": -task.estimator.estimatedHours,
                        "negotiator.estimatedHours": -task.negotiator.estimatedHours
                    },
                    "canApprove": false,
                    "hasError": false
                })
            }

        } else if (task.estimator.estimatedHours) {
            //only estimated hours is there in this task
            // As task is removed we have to check for has error in feature except deleting task
            if (await EstimationTaskModel.count({
                    "hasError": true,
                    "isDeleted": false,
                    "feature._id": feature._id,
                    "estimation._id": estimation._id
                }) + task.hasError ? (-1) : 0 > 0
                    || _.isEmpty(feature.estimator.name)
                    || _.isEmpty(feature.estimator.description)
                    || (feature.estimator.estimatedHours - task.estimator.estimatedHours) <= 0) {
                //there is still error after deleting this task
                await EstimationFeatureModel.updateOne({_id: feature._id}, {
                    $inc: {"estimator.estimatedHours": -task.estimator.estimatedHours},
                    "canApprove": false,
                    "hasError": true
                })
            } else {
                //there is no error after deleting this task
                await EstimationFeatureModel.updateOne({_id: feature._id}, {
                    $inc: {"estimator.estimatedHours": -task.estimator.estimatedHours},
                    "canApprove": false,
                    "hasError": false
                })
            }


        } else if (task.negotiator.estimatedHours) {

            //only suggested hours is there in this task
            // As task is removed we have to check for has error in feature except deleting task
            if (await EstimationTaskModel.count({
                    "hasError": true,
                    "isDeleted": false,
                    "feature._id": feature._id,
                    "estimation._id": estimation._id
                }) + task.hasError ? (-1) : 0 > 0
                    || _.isEmpty(feature.estimator.name)
                    || _.isEmpty(feature.estimator.description)
                    || (feature.estimator.estimatedHours - task.estimator.estimatedHours) <= 0) {

                //there is still error after deleting this task
                await EstimationFeatureModel.updateOne({_id: feature._id}, {
                    $inc: {"negotiator.estimatedHours": -task.negotiator.estimatedHours},
                    "canApprove": false,
                    "hasError": true
                })
            } else {
                //there is no error after deleting this task
                await EstimationFeatureModel.updateOne({_id: feature._id}, {
                    $inc: {"negotiator.estimatedHours": -task.negotiator.estimatedHours},
                    "canApprove": false,
                    "hasError": false
                })
            }

        }
    }

    if (estimation && estimation._id) {
        // As task is removed we have to subtract hours ($inc with minus) of this task from overall estimated hours and suggested hours of estimation

        if (task.negotiator.estimatedHours && task.estimator.estimatedHours) {
            await EstimationModel.updateOne({_id: estimation._id}, {
                $inc: {
                    "estimatedHours": -task.estimator.estimatedHours,
                    "suggestedHours": -task.negotiator.estimatedHours
                },
                "canApprove": false
            })

        } else if (task.estimator.estimatedHours) {
            await EstimationModel.updateOne({_id: estimation._id}, {
                $inc: {"estimatedHours": -task.estimator.estimatedHours},
                "canApprove": false
            })
        } else if (task.negotiator.estimatedHours) {
            await EstimationModel.updateOne({_id: feature._id}, {
                $inc: {"suggestedHours": -task.negotiator.estimatedHours},
                "canApprove": false
            })
        }

    }
    task.isDeleted = true
    task.estimator.changedInThisIteration = true
    task.updated = Date.now()
    return await task.save()
}


// delete task by negotiator
const deleteTaskByNegotiator = async (task, estimation, negotiator) => {


    if (estimation.negotiator._id != negotiator._id)
        throw new AppError('Not an negotiator', EC.INVALID_USER, EC.HTTP_BAD_REQUEST)


    if (task.feature && task.feature._id) {
        let feature = await EstimationFeatureModel.findById(task.feature._id)
        if (!feature)
            throw new AppError('Feature that this task is associated with is not found', EC.NOT_FOUND, EC.HTTP_BAD_REQUEST)

        if (task.estimator.estimatedHours && task.negotiator.estimatedHours) {
            // As task is removed we have to check for has error in feature except deleting task
            if (await EstimationTaskModel.count({
                    "hasError": true,
                    "isDeleted": false,
                    "feature._id": feature._id,
                    "estimation._id": estimation._id
                }) + task.hasError ? (-1) : 0 > 0
                    || _.isEmpty(feature.estimator.name)
                    || _.isEmpty(feature.estimator.description)
                    || (feature.estimator.estimatedHours - task.estimator.estimatedHours) <= 0) {
                //there is still error after deleting this task
                await EstimationFeatureModel.updateOne({_id: feature._id}, {
                    $inc: {
                        "estimator.estimatedHours": -task.estimator.estimatedHours,
                        "negotiator.estimatedHours": -task.negotiator.estimatedHours
                    },
                    "canApprove": false,
                    "hasError": true
                })

            } else {
                //there is no error after deleting this task
                await EstimationFeatureModel.updateOne({_id: feature._id}, {
                    $inc: {
                        "estimator.estimatedHours": -task.estimator.estimatedHours,
                        "negotiator.estimatedHours": -task.negotiator.estimatedHours
                    },
                    "canApprove": false,
                    "hasError": false
                })
            }

        } else if (task.estimator.estimatedHours) {
            //only estimated hours is there in this task
            // As task is removed we have to check for has error in feature except deleting task
            if (await EstimationTaskModel.count({
                    "hasError": true,
                    "isDeleted": false,
                    "feature._id": feature._id,
                    "estimation._id": estimation._id
                }) + task.hasError ? (-1) : 0 > 0
                    || _.isEmpty(feature.estimator.name)
                    || _.isEmpty(feature.estimator.description)
                    || (feature.estimator.estimatedHours - task.estimator.estimatedHours) <= 0) {
                //there is still error after deleting this task
                await EstimationFeatureModel.updateOne({_id: feature._id}, {
                    $inc: {"estimator.estimatedHours": -task.estimator.estimatedHours},
                    "canApprove": false,
                    "hasError": true
                })
            } else {
                //there is no error after deleting this task
                await EstimationFeatureModel.updateOne({_id: feature._id}, {
                    $inc: {"estimator.estimatedHours": -task.estimator.estimatedHours},
                    "canApprove": false,
                    "hasError": false
                })
            }


        } else if (task.negotiator.estimatedHours) {

            //only suggested hours is there in this task
            // As task is removed we have to check for has error in feature except deleting task
            if (await EstimationTaskModel.count({
                    "hasError": true,
                    "isDeleted": false,
                    "feature._id": feature._id,
                    "estimation._id": estimation._id
                }) + task.hasError ? (-1) : 0 > 0
                    || _.isEmpty(feature.estimator.name)
                    || _.isEmpty(feature.estimator.description)
                    || (feature.estimator.estimatedHours - task.estimator.estimatedHours) <= 0) {

                //there is still error after deleting this task
                await EstimationFeatureModel.updateOne({_id: feature._id}, {
                    $inc: {"negotiator.estimatedHours": -task.negotiator.estimatedHours},
                    "canApprove": false,
                    "hasError": true
                })
            } else {
                //there is no error after deleting this task
                await EstimationFeatureModel.updateOne({_id: feature._id}, {
                    $inc: {"negotiator.estimatedHours": -task.negotiator.estimatedHours},
                    "canApprove": false,
                    "hasError": false
                })
            }

        }

        if ((task.estimator.removalRequested || task.estimator.changeRequested ) && (
                await EstimationTaskModel.count({
                    "feature._id": feature._id,
                    "isDeleted": false,
                    "estimator.removalRequested": true
                }) + await EstimationTaskModel.count({
                    "feature._id": feature._id,
                    "isDeleted": false,
                    "estimator.changeRequested": true
                })) <= 1) {
            await EstimationFeatureModel.updateOne({_id: feature._id}, {
                $set: {"estimator.requestedInThisIteration": false}
            })
        }


    }
    if (estimation && estimation._id) {
        // As task is removed we have to subtract hours ($inc with minus) of this task from overall estimated hours and suggested hours of estimation

        if (task.negotiator.estimatedHours && task.estimator.estimatedHours) {
            await EstimationModel.updateOne({_id: estimation._id}, {
                $inc: {
                    "estimatedHours": -task.estimator.estimatedHours,
                    "suggestedHours": -task.negotiator.estimatedHours
                },
                "canApprove": false
            })

        } else if (task.estimator.estimatedHours) {
            await EstimationModel.updateOne({_id: estimation._id}, {
                $inc: {"estimatedHours": -task.estimator.estimatedHours},
                "canApprove": false
            })
        } else if (task.negotiator.estimatedHours) {
            await EstimationModel.updateOne({_id: estimation._id}, {
                $inc: {"suggestedHours": -task.negotiator.estimatedHours},
                "canApprove": false
            })
        }

    }
    task.isDeleted = true
    task.negotiator.changedInThisIteration = true
    task.updated = Date.now()
    return await task.save()
}


// grant reOpen permission of task
estimationTaskSchema.statics.grantReOpenPermissionOfTask = async (taskID, user) => {
    let task = await EstimationTaskModel.findById(taskID)
    if (!task)
        throw new AppError('Task not found', EC.NOT_FOUND, EC.HTTP_BAD_REQUEST)


    if (!task.estimation || !task.estimation._id)
        throw new AppError('Estimation Identifier required at [estimation._id]', EC.NOT_FOUND, EC.HTTP_BAD_REQUEST)

    let estimation = await EstimationModel.findOne({"_id": task.estimation._id})
    if (!estimation)
        throw new AppError('Estimation not found', EC.NOT_FOUND, EC.HTTP_BAD_REQUEST)


    let role = await EstimationModel.getUserRoleInEstimation(estimation._id, user)
    if (role === SC.ROLE_ESTIMATOR) {
        throw new AppError("Only user with role [" + SC.ROLE_NEGOTIATOR + "] can grant reopen permission of task into estimation", EC.ACCESS_DENIED, EC.HTTP_FORBIDDEN)

    } else if (role === SC.ROLE_NEGOTIATOR) {
        return await grantReOpenPermissionOfTaskByNegotiator(task, estimation, user)
    }
    throw new AppError('You play no role in this estimation', EC.INVALID_USER, EC.HTTP_BAD_REQUEST)
}

// grant reOpen permission of task by negotiator
const grantReOpenPermissionOfTaskByNegotiator = async (task, estimation, negotiator) => {

    if (!_.includes([SC.STATUS_INITIATED, SC.STATUS_REVIEW_REQUESTED], estimation.status))
        throw new AppError("Estimation has status as [" + estimation.status + "]. Negotiator can only given grant edit permission to task into those estimations where status is in [" + SC.STATUS_INITIATED + ", " + SC.STATUS_REVIEW_REQUESTED + "]", EC.INVALID_OPERATION, EC.HTTP_BAD_REQUEST)

    if (!estimation.negotiator._id == negotiator._id)
        throw new AppError('Not an negotiator', EC.INVALID_USER, EC.HTTP_BAD_REQUEST)

    if (!task.addedInThisIteration || task.owner != SC.OWNER_NEGOTIATOR)
        task.negotiator.changedInThisIteration = true

    let estimationFeatureObj
    if (task.feature && task.feature._id) {
        if ((
                await EstimationTaskModel.count({
                    "feature._id": task.feature._id,
                    "isDeleted": false,
                    "estimator.removalRequested": true
                })
                + await EstimationTaskModel.count({
                    "feature._id": task.feature._id,
                    "isDeleted": false,
                    "estimator.changeRequested": true
                })
            ) <= 1) {
            await EstimationFeatureModel.updateOne({_id: task.feature._id}, {
                $set: {"estimator.requestedInThisIteration": false}
            })
        }
        estimationFeatureObj = await EstimationFeatureModel.findById(task.feature._id)
        if (!estimationFeatureObj)
            throw new AppError('Feature not found', EC.NOT_FOUND, EC.HTTP_BAD_REQUEST)

        if (estimation._id.toString() != estimationFeatureObj.estimation._id.toString())
            throw new AppError('Feature not found for this estimation', EC.NOT_FOUND, EC.HTTP_BAD_REQUEST)

        await EstimationFeatureModel.updateOne({"_id": task.feature._id}, {
            "status": SC.STATUS_PENDING,
            "canApprove": false
        })
    }

    task.negotiator.changeGranted = !task.negotiator.changeGranted
    task.canApprove = false
    task.status = SC.STATUS_PENDING
    task.updated = Date.now()
    await task.save()

    task = task.toObject()
    if (estimation && estimation.canApprove) {
        task.isEstimationCanApprove = true
    }
    return task
}


// approve task
estimationTaskSchema.statics.approveTask = async (taskID, user) => {
    let task = await EstimationTaskModel.findById(taskID)
    if (!task)
        throw new AppError('Task not found', EC.NOT_FOUND, EC.HTTP_BAD_REQUEST)


    if (!task.estimation || !task.estimation._id)
        throw new AppError('Estimation Identifier required at [estimation._id]', EC.NOT_FOUND, EC.HTTP_BAD_REQUEST)

    let estimation = await EstimationModel.findOne({"_id": task.estimation._id})
    if (!estimation)
        throw new AppError('Estimation not found', EC.NOT_FOUND, EC.HTTP_BAD_REQUEST)


    let role = await EstimationModel.getUserRoleInEstimation(estimation._id, user)
    if (role === SC.ROLE_ESTIMATOR) {
        throw new AppError("Only user with role [" + SC.ROLE_NEGOTIATOR + "] can approve task into estimation", EC.ACCESS_DENIED, EC.HTTP_FORBIDDEN)

    } else if (role === SC.ROLE_NEGOTIATOR) {
        return await approveTaskByNegotiator(task, estimation, user)
    }
    throw new AppError('You play no role in this estimation', EC.INVALID_USER, EC.HTTP_BAD_REQUEST)
}


const approveTaskByNegotiator = async (task, estimation, negotiator) => {

    if (!_.includes([SC.STATUS_REVIEW_REQUESTED], estimation.status))
        throw new AppError("Estimation has status as [" + estimation.status + "]. Negotiator can only approve task into those estimations where status is in [" + SC.STATUS_REVIEW_REQUESTED + "]", EC.INVALID_OPERATION, EC.HTTP_BAD_REQUEST)

    if (!(task.canApprove))
        throw new AppError('Cannot approve task as either name/description is not not there or there are pending requests from Estimator', EC.TASK_APPROVAL_ERROR, EC.HTTP_FORBIDDEN)

    if (task.negotiator.estimatedHours != task.estimator.estimatedHours) {

        if (estimation && estimation._id) {
            await EstimationModel.updateOne({"_id": estimation._id}, {
                $inc: {
                    "suggestedHours": task.negotiator.estimatedHours ? task.estimator.estimatedHours - task.negotiator.estimatedHours : task.estimator.estimatedHours,
                },
            })
        }
        if (task.feature && task.feature._id) {
            await EstimationFeatureModel.updateOne({"_id": task.feature._id}, {
                $inc: {
                    "negotiator.estimatedHours": task.negotiator.estimatedHours ? task.estimator.estimatedHours - task.negotiator.estimatedHours : task.estimator.estimatedHours,
                },
            })
        }
    }


    task.negotiator.name = task.estimator.name
    task.negotiator.description = task.estimator.description
    task.negotiator.estimatedHours = task.estimator.estimatedHours
    task.negotiator.changeSuggested = false
    task.negotiator.changeGranted = false
    task.negotiator.changedInThisIteration = false
    task.negotiator.isMovedToFeature = false
    task.negotiator.isMovedOutOfFeature = false
    task.estimatorchangeRequested = false
    task.estimatorchangedKeyInformation = false
    task.estimatorremovalRequested = false
    task.estimatorchangedInThisIteration = false
    task.estimatorisMovedToFeature = false
    task.estimatorisMovedOutOfFeature = false
    task.status = SC.STATUS_APPROVED
    task.canApprove = false
    task.updated = Date.now()
    return await task.save()
}

// add task from repo
estimationTaskSchema.statics.addTaskFromRepository = async (estimationID, repositoryTaskID, user) => {

    let role = await EstimationModel.getUserRoleInEstimation(estimationID, user)
    if (role === SC.ROLE_ESTIMATOR) {
        return await addTaskFromRepositoryByEstimator(estimationID, repositoryTaskID, user)
    } else if (role === SC.ROLE_NEGOTIATOR) {
        return await addTaskFromRepositoryByNegotiator(estimationID, repositoryTaskID, user)
    }
    throw new AppError('You play no role in this estimation', EC.INVALID_USER, EC.HTTP_BAD_REQUEST)
}

const addTaskFromRepositoryByEstimator = async (estimationID, repositoryTaskID, estimator) => {

    if (!estimator || !userHasRole(estimator, SC.ROLE_ESTIMATOR))
        throw new AppError('Not an estimator', EC.INVALID_USER, EC.HTTP_BAD_REQUEST)

    let repositoryTask = await RepositoryModel.findById(repositoryTaskID)
    if (!repositoryTask)
        throw new AppError('Task not found in repository', EC.NOT_FOUND, EC.HTTP_BAD_REQUEST)

    if (repositoryTask.isFeature)
        throw new AppError('This is not a task but a feature', EC.NOT_FOUND, EC.HTTP_BAD_REQUEST)

    /*
    TODO: Need to uncomment this once repository approve functionality is in place
    if (!_.includes([SC.STATUS_APPROVED], repositoryTask.status))
        throw new AppError('This repository task is not yet approved so cannot be added to this estimation', EC.ACCESS_DENIED, EC.HTTP_BAD_REQUEST)
        */

    let estimation = await EstimationModel.findById(estimationID)
    if (!estimation)
        throw new AppError('Estimation not found', EC.NOT_FOUND, EC.HTTP_BAD_REQUEST)

    if (!_.includes([SC.STATUS_ESTIMATION_REQUESTED, SC.STATUS_CHANGE_REQUESTED], estimation.status))
        throw new AppError("Estimation has status as [" + estimation.status + "]. Estimator can add task from repository into those estimations where status is in [" + SC.STATUS_ESTIMATION_REQUESTED + "," + SC.STATUS_CHANGE_REQUESTED + "]", EC.INVALID_OPERATION, EC.HTTP_BAD_REQUEST)

    if (!estimation.estimator._id == estimator._id)
        throw new AppError('Not an estimator', EC.INVALID_USER, EC.HTTP_BAD_REQUEST)

    let thisTaskWithRepoAlreadyExist = await EstimationTaskModel.findOne({
        "repo._id": repositoryTask._id,
        "isDeleted": false,
        "estimation._id": estimation._id
    })
    if (thisTaskWithRepoAlreadyExist)
        throw new AppError('This task is already part of estimation', EC.ALREADY_EXISTS, EC.HTTP_BAD_REQUEST)

    if (estimation && estimation._id && repositoryTask.estimatedHours && repositoryTask.estimatedHours > 0) {
        await EstimationModel.updateOne({_id: estimation._id}, {
            $inc: {"estimatedHours": repositoryTask.estimatedHours}
        })
    }

    let estimationTask = new EstimationTaskModel()
    // As task is added from repository its information can directly be copied into estimator section (even if it is being added by negotiator)
    estimationTask.estimator.name = repositoryTask.name
    estimationTask.estimator.description = repositoryTask.description
    estimationTask.estimator.estimatedHours = repositoryTask.estimatedHours ? repositoryTask.estimatedHours : 0
    estimationTask.negotiator.name = repositoryTask.name
    estimationTask.negotiator.description = repositoryTask.description
    estimationTask.negotiator.estimatedHours = repositoryTask.estimatedHours ? repositoryTask.estimatedHours : 0
    estimationTask.status = SC.STATUS_PENDING
    estimationTask.addedInThisIteration = true
    estimationTask.canApprove = false
    estimationTask.owner = SC.OWNER_ESTIMATOR
    estimationTask.initiallyEstimated = true
    estimationTask.estimation = estimation
    estimationTask.technologies = estimation.technologies
    estimationTask.repo = {}
    estimationTask.repo._id = repositoryTask._id
    estimationTask.repo.addedFromThisEstimation = false

    await estimationTask.save()

    estimationTask = estimationTask.toObject()
    if (estimation && estimation.canApprove) {
        estimationTask.isEstimationCanApprove = true
    }
    return estimationTask

}


const addTaskFromRepositoryByNegotiator = async (estimationID, repositoryTaskID, negotiator) => {

    if (!negotiator || !userHasRole(negotiator, SC.ROLE_NEGOTIATOR))
        throw new AppError('Not an negotiator', EC.INVALID_USER, EC.HTTP_BAD_REQUEST)

    let repositoryTask = await RepositoryModel.findById(repositoryTaskID)
    if (!repositoryTask)
        throw new AppError('Task not found in repository', EC.NOT_FOUND, EC.HTTP_BAD_REQUEST)

    /**
     TODO: Need to uncomment code once we have repository task approval feature in place
     if (!_.includes([SC.STATUS_APPROVED], repositoryTask.status))
     throw new AppError('This repository task is not yet approved so cannot be added to this estimation', EC.ACCESS_DENIED, EC.HTTP_BAD_REQUEST)
     **/

    if (repositoryTask.isFeature)
        throw new AppError('This is not a task but a feature', EC.NOT_FOUND, EC.HTTP_BAD_REQUEST)

    let estimation = await EstimationModel.findById(estimationID)
    if (!estimation)
        throw new AppError('Estimation not found', EC.NOT_FOUND, EC.HTTP_BAD_REQUEST)

    if (!_.includes([SC.STATUS_INITIATED, SC.STATUS_REVIEW_REQUESTED], estimation.status))
        throw new AppError("Estimation has status as [" + estimation.status + "]. Negotiator can add task from repository into those estimations where status is in [" + SC.STATUS_REVIEW_REQUESTED + "," + SC.STATUS_INITIATED + "]", EC.INVALID_OPERATION, EC.HTTP_BAD_REQUEST)

    if (!estimation.negotiator._id == negotiator._id)
        throw new AppError('Not a Negotiator', EC.INVALID_USER, EC.HTTP_BAD_REQUEST)

    let checkExistsCount = await EstimationTaskModel.count({
        "repo._id": repositoryTask._id,
        "isDeleted": false,
        "estimation._id": estimation._id
    })
    if (checkExistsCount > 0)
        throw new AppError('This task from repository already added', EC.ALREADY_EXISTS, EC.HTTP_BAD_REQUEST)

    if (estimation && estimation._id && repositoryTask.estimatedHours && repositoryTask.estimatedHours > 0) {
        await EstimationModel.updateOne({_id: estimation._id}, {
            $inc: {"estimatedHours": repositoryTask.estimatedHours}
        })
    }
    // As task is added from repository its information can directly be copied into estimator section (even if it is being added by negotiator)
    let taskFromRepositoryObj = new EstimationTaskModel()
    taskFromRepositoryObj.estimator.name = repositoryTask.name
    taskFromRepositoryObj.estimator.description = repositoryTask.description
    taskFromRepositoryObj.estimator.estimatedHours = repositoryTask.estimatedHours ? repositoryTask.estimatedHours : 0
    taskFromRepositoryObj.negotiator.name = repositoryTask.name
    taskFromRepositoryObj.negotiator.description = repositoryTask.description
    taskFromRepositoryObj.negotiator.estimatedHours = repositoryTask.estimatedHours ? repositoryTask.estimatedHours : 0
    taskFromRepositoryObj.status = SC.STATUS_PENDING
    taskFromRepositoryObj.addedInThisIteration = true
    taskFromRepositoryObj.canApprove = false
    taskFromRepositoryObj.owner = SC.OWNER_NEGOTIATOR
    taskFromRepositoryObj.initiallyEstimated = true

    taskFromRepositoryObj.estimation = estimation
    taskFromRepositoryObj.technologies = estimation.technologies
    taskFromRepositoryObj.repo = {}
    taskFromRepositoryObj.repo._id = repositoryTask._id
    taskFromRepositoryObj.repo.addedFromThisEstimation = false
    let taskFromRepo = await EstimationTaskModel.create(taskFromRepositoryObj)
    taskFromRepo = taskFromRepo.toObject()
    if (estimation && estimation.canApprove) {
        taskFromRepo.isEstimationCanApprove = true
    }
    return taskFromRepo
}


// copy task from repo
estimationTaskSchema.statics.copyTaskFromRepository = async (estimationID, repositoryTaskID, user) => {

    let role = await EstimationModel.getUserRoleInEstimation(estimationID, user)
    if (role === SC.ROLE_ESTIMATOR) {
        return await copyTaskFromRepositoryByEstimator(estimationID, repositoryTaskID, user)
    } else if (role === SC.ROLE_NEGOTIATOR) {
        return await copyTaskFromRepositoryByNegotiator(estimationID, repositoryTaskID, user)
    }
    throw new AppError('You play no role in this estimation', EC.INVALID_USER, EC.HTTP_BAD_REQUEST)
}

// copy task from repo by estimator
const copyTaskFromRepositoryByEstimator = async (estimationID, repositoryTaskID, estimator) => {

    if (!estimator || !userHasRole(estimator, SC.ROLE_ESTIMATOR))
        throw new AppError('Not an estimator', EC.INVALID_USER, EC.HTTP_BAD_REQUEST)

    let repositoryTask = await RepositoryModel.findById(repositoryTaskID)
    if (!repositoryTask)
        throw new AppError('Task not found in repository', EC.NOT_FOUND, EC.HTTP_BAD_REQUEST)

    if (repositoryTask.isFeature)
        throw new AppError('This is not a task but a feature', EC.NOT_FOUND, EC.HTTP_BAD_REQUEST)

    /*
    TODO: Need to uncomment this once repository approve functionality is in place
    if (!_.includes([SC.STATUS_APPROVED], repositoryTask.status))
        throw new AppError('This repository task is not yet approved so cannot be added to this estimation', EC.ACCESS_DENIED, EC.HTTP_BAD_REQUEST)
        */

    let estimation = await EstimationModel.findById(estimationID)
    if (!estimation)
        throw new AppError('Estimation not found', EC.NOT_FOUND, EC.HTTP_BAD_REQUEST)

    if (!_.includes([SC.STATUS_ESTIMATION_REQUESTED, SC.STATUS_CHANGE_REQUESTED], estimation.status))
        throw new AppError("Estimation has status as [" + estimation.status + "]. Estimator can add task from repository into those estimations where status is in [" + SC.STATUS_ESTIMATION_REQUESTED + "," + SC.STATUS_CHANGE_REQUESTED + "]", EC.INVALID_OPERATION, EC.HTTP_BAD_REQUEST)

    if (!estimation.estimator._id == estimator._id)
        throw new AppError('Not an estimator', EC.INVALID_USER, EC.HTTP_BAD_REQUEST)

    if (estimation && estimation._id && repositoryTask.estimatedHours && repositoryTask.estimatedHours > 0) {
        await EstimationModel.updateOne({_id: estimation._id}, {
            $inc: {"estimatedHours": repositoryTask.estimatedHours}
        })
    }

    /*  let thisTaskWithRepoAlreadyExist = await EstimationTaskModel.findOne({
          "repo._id": repositoryTask._id,
          "estimation._id": estimation._id
      })
      */
    //if (thisTaskWithRepoAlreadyExist)
    //   throw new AppError('This task is already part of estimation', EC.ALREADY_EXISTS, EC.HTTP_BAD_REQUEST)


    let estimationTask = new EstimationTaskModel()
    // As task is added from repository its information can directly be copied into estimator section (even if it is being added by negotiator)
    estimationTask.estimator.name = repositoryTask.name
    estimationTask.estimator.description = repositoryTask.description
    estimationTask.status = SC.STATUS_PENDING
    estimationTask.addedInThisIteration = true
    estimationTask.canApprove = false
    estimationTask.owner = SC.OWNER_ESTIMATOR
    estimationTask.initiallyEstimated = true
    estimationTask.estimation = estimation
    estimationTask.technologies = estimation.technologies
    estimationTask.repo = {}
    //estimationTask.repo._id = repositoryTask._id
    estimationTask.repo.addedFromThisEstimation = true
    if (repositoryTask.estimatedHours)
        estimationTask.estimator.estimatedHours = repositoryTask.estimatedHours
    else
        estimationTask.estimator.estimatedHours = 0

    await estimationTask.save()
    estimationTask = estimationTask.toObject()
    if (estimation && estimation.canApprove) {
        estimationTask.isEstimationCanApprove = true
    }
    return estimationTask


}


// copy task from repo by negotiator
const copyTaskFromRepositoryByNegotiator = async (estimationID, repositoryTaskID, negotiator) => {

    if (!negotiator || !userHasRole(negotiator, SC.ROLE_NEGOTIATOR))
        throw new AppError('Not an negotiator', EC.INVALID_USER, EC.HTTP_BAD_REQUEST)

    let repositoryTask = await RepositoryModel.findById(repositoryTaskID)
    if (!repositoryTask)
        throw new AppError('Task not found in repository', EC.NOT_FOUND, EC.HTTP_BAD_REQUEST)

    /**
     TODO: Need to uncomment code once we have repository task approval feature in place
     if (!_.includes([SC.STATUS_APPROVED], repositoryTask.status))
     throw new AppError('This repository task is not yet approved so cannot be added to this estimation', EC.ACCESS_DENIED, EC.HTTP_BAD_REQUEST)
     **/

    if (repositoryTask.isFeature)
        throw new AppError('This is not a task but a feature', EC.NOT_FOUND, EC.HTTP_BAD_REQUEST)

    let estimation = await EstimationModel.findById(estimationID)
    if (!estimation)
        throw new AppError('Estimation not found', EC.NOT_FOUND, EC.HTTP_BAD_REQUEST)

    if (!_.includes([SC.STATUS_INITIATED, SC.STATUS_REVIEW_REQUESTED], estimation.status))
        throw new AppError("Estimation has status as [" + estimation.status + "]. Negotiator can add task from repository into those estimations where status is in [" + SC.STATUS_REVIEW_REQUESTED + "," + SC.STATUS_INITIATED + "]", EC.INVALID_OPERATION, EC.HTTP_BAD_REQUEST)

    if (!estimation.negotiator._id == negotiator._id)
        throw new AppError('Not a Negotiator', EC.INVALID_USER, EC.HTTP_BAD_REQUEST)

    if (estimation && estimation._id && repositoryTask.estimatedHours && repositoryTask.estimatedHours > 0) {
        await EstimationModel.updateOne({_id: estimation._id}, {
            $inc: {"estimatedHours": repositoryTask.estimatedHours}
        })
    }
    /*let checkExistsCount = await EstimationTaskModel.count({
        "repo._id": repositoryTask._id,
        "estimation._id": estimation._id
    })
    if (checkExistsCount > 0)
        throw new AppError('This task from repository already added', EC.ALREADY_EXISTS, EC.HTTP_BAD_REQUEST)*/

    // As task is added from repository its information can directly be copied into estimator section (even if it is being added by negotiator)
    let taskFromRepositoryObj = new EstimationTaskModel()
    taskFromRepositoryObj.negotiator.name = repositoryTask.name
    taskFromRepositoryObj.negotiator.description = repositoryTask.description
    taskFromRepositoryObj.negotiator.estimatedHours = repositoryTask.estimatedHours ? repositoryTask.estimatedHours : 0
    taskFromRepositoryObj.status = SC.STATUS_PENDING
    taskFromRepositoryObj.addedInThisIteration = true
    taskFromRepositoryObj.owner = SC.OWNER_NEGOTIATOR
    taskFromRepositoryObj.initiallyEstimated = true
    taskFromRepositoryObj.canApprove = false

    taskFromRepositoryObj.estimation = estimation
    taskFromRepositoryObj.technologies = estimation.technologies
    taskFromRepositoryObj.repo = {}
    //taskFromRepositoryObj.repo._id = repositoryTask._id
    taskFromRepositoryObj.repo.addedFromThisEstimation = true

    let taskFromRepo = await EstimationTaskModel.create(taskFromRepositoryObj)
    taskFromRepo = taskFromRepo.toObject()
    if (estimation && estimation.canApprove) {
        taskFromRepo.isEstimationCanApprove = true
    }
    return taskFromRepo

}


// reOpen task
estimationTaskSchema.statics.reOpenTask = async (taskID, user) => {
    let task = await EstimationTaskModel.findById(taskID)
    if (!task)
        throw new AppError('Task not found', EC.NOT_FOUND, EC.HTTP_BAD_REQUEST)


    if (!task.estimation || !task.estimation._id)
        throw new AppError('Estimation Identifier required at [estimation._id]', EC.NOT_FOUND, EC.HTTP_BAD_REQUEST)

    let estimation = await EstimationModel.findOne({"_id": task.estimation._id})
    if (!estimation)
        throw new AppError('Estimation not found', EC.NOT_FOUND, EC.HTTP_BAD_REQUEST)


    let role = await EstimationModel.getUserRoleInEstimation(estimation._id, user)
    if (role === SC.ROLE_ESTIMATOR) {
        throw new AppError("Only users with role [" + SC.ROLE_NEGOTIATOR + "] can directly reOpen task into estimation", EC.ACCESS_DENIED, EC.HTTP_FORBIDDEN)

    } else if (role === SC.ROLE_NEGOTIATOR) {
        return await reOpenTaskByNegotiator(task, estimation, user)
    }
    throw new AppError('You play no role in this estimation', EC.INVALID_USER, EC.HTTP_BAD_REQUEST)
}


// reOpen task by negotiator
const reOpenTaskByNegotiator = async (task, estimation, negotiator) => {

    let estimationFeatureObj

    if (estimation.status == SC.STATUS_APPROVED)
        throw new AppError('Estimation is already approved task can not be reopen ', EC.HTTP_BAD_REQUEST)

    if (!_.includes([SC.STATUS_REVIEW_REQUESTED], estimation.status))
        throw new AppError("Negotiator has status as [" + estimation.status + "]. Negotiator can only ReOpen task into those estimations where status is in [" + SC.STATUS_REVIEW_REQUESTED + "]", EC.INVALID_OPERATION, EC.HTTP_BAD_REQUEST)

    if (estimation.negotiator._id != negotiator._id)
        throw new AppError('Not an negotiator', EC.INVALID_USER, EC.HTTP_BAD_REQUEST)
    if (task && task.feature && task.feature._id) {
        estimationFeatureObj = await EstimationFeatureModel.findById(task.feature._id)
        if (!estimationFeatureObj)
            throw new AppError('Feature not found', EC.NOT_FOUND, EC.HTTP_BAD_REQUEST)

        await EstimationFeatureModel.updateOne({"_id": task.feature._id}, {
            "status": SC.STATUS_PENDING,
            "canApprove": false
        })
    }

    task.status = SC.STATUS_PENDING
    task.canApprove = true
    await task.save()
    task = task.toObject()

    if (estimationFeatureObj && estimationFeatureObj.canApprove) {
        task.isFeatureCanApprove = true
    }
    if (estimationFeatureObj && estimationFeatureObj.status == SC.STATUS_APPROVED) {
        task.isFeatureApproved = true
    }

    if (estimation && estimation.canApprove) {
        task.isEstimationCanApprove = true
    }

    return task

}


const EstimationTaskModel = mongoose.model("EstimationTask", estimationTaskSchema)
export default EstimationTaskModel
