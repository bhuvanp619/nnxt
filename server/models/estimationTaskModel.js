import mongoose from 'mongoose'
import AppError from '../AppError'
import * as EC from '../errorcodes'
import * as SC from "../serverconstants"
import {
    estimationEstimatorAddTaskStruct,
    estimationEstimatorUpdateTaskStruct,
    estimationNegotiatorAddTaskStruct,
    estimationNegotiatorUpdateTaskStruct,
    validate
} from "../validation"
import {userHasRole} from "../utils"
import {EstimationFeatureModel, EstimationModel, RepositoryModel} from "./"
import _ from 'lodash'

mongoose.Promise = global.Promise

let estimationTaskSchema = mongoose.Schema({
    status: {type: String, enum: [SC.STATUS_APPROVED, SC.STATUS_PENDING], required: true, default: SC.STATUS_PENDING},
    owner: {type: String, enum: [SC.OWNER_ESTIMATOR, SC.OWNER_NEGOTIATOR], required: true},
    addedInThisIteration: {type: Boolean, required: true},
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

estimationTaskSchema.statics.addTaskByEstimator = async (taskInput, estimator) => {
    validate(taskInput, estimationEstimatorAddTaskStruct)
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
        // As task is being added into feature estimated hours of task would be added into current estimated hours of feature
        await EstimationFeatureModel.updateOne({_id: taskInput.feature._id}, {$inc: {"estimator.estimatedHours": taskInput.estimatedHours}})
    }

   /* let repositoryTask = repositoryTask = await RepositoryModel.addTask({
        name: taskInput.name,
        description: taskInput.description,
        estimation: {
            _id: estimation._id.toString()
        },
        feature: taskInput.feature,
        createdBy: estimator,
        technologies: estimation.technologies, // Technologies of estimation would be copied directly to tasks
        tags: taskInput.tags
    }, estimator)*/

    let estimationTask = new EstimationTaskModel()
    estimationTask.estimator.name = taskInput.name
    estimationTask.estimator.description = taskInput.description
    estimationTask.estimator.estimatedHours = taskInput.estimatedHours
    estimationTask.status = SC.STATUS_PENDING
    estimationTask.addedInThisIteration = true
    estimationTask.owner = SC.OWNER_ESTIMATOR
    estimationTask.initiallyEstimated = true
    estimationTask.estimation = taskInput.estimation
    estimationTask.technologies = estimation.technologies
    // Add repository reference and also note that this task was added into repository from this estimation
    estimationTask.feature=taskInput.feature
    //estimationTask.repo._id = repositoryTask._id
    estimationTask.repo.addedFromThisEstimation = true

    if (!_.isEmpty(taskInput.notes)) {
        estimationTask.notes = taskInput.notes.map(n => {
            n.name = estimator.fullName
            return n
        })
    }

    return await estimationTask.save()
}

estimationTaskSchema.statics.addTaskByNegotiator = async (taskInput, negotiator) => {
    validate(taskInput, estimationNegotiatorAddTaskStruct)

    if (!negotiator || !userHasRole(negotiator, SC.ROLE_NEGOTIATOR))
        throw new AppError('Not a negotiator', EC.INVALID_USER, EC.HTTP_BAD_REQUEST)
    let estimation = await EstimationModel.findById(taskInput.estimation._id)
    if (!estimation)
        throw new AppError('Estimation not found', EC.NOT_FOUND, EC.HTTP_BAD_REQUEST)
    if (!_.includes([SC.STATUS_INITIATED, SC.STATUS_REVIEW_REQUESTED], estimation.status))
        throw new AppError("Estimation has status as [" + estimation.status + "]. Negotiator can only add task into those estimations where status is in [" + SC.STATUS_INITIATED + ", " + SC.STATUS_REVIEW_REQUESTED + "]", EC.INVALID_OPERATION, EC.HTTP_BAD_REQUEST)

    if (taskInput.feature && taskInput.feature._id) {
        // task is part of some feature,

        let estimationFeatureObj = await EstimationFeatureModel.findById(taskInput.feature._id)
        if (!estimationFeatureObj)
            throw new AppError('Feature not found', EC.NOT_FOUND, EC.HTTP_BAD_REQUEST)

        if (estimation._id.toString() != estimationFeatureObj.estimation._id.toString())
            throw new AppError('Feature not found for this estimation', EC.NOT_FOUND, EC.HTTP_BAD_REQUEST)

        // As task is being added by negotiator there would not be any change in estimated hours of feature as this would just be considered as suggestions
    }

   /* let repositoryTask = await RepositoryModel.addTask({
        name: taskInput.name,
        description: taskInput.description,
        estimation: {
            _id: estimation._id.toString()
        },
        feature: taskInput.feature,
        createdBy: negotiator,
        technologies: estimation.technologies
    }, negotiator)*/

    let estimationTask = new EstimationTaskModel()
    estimationTask.negotiator.name = taskInput.name
    estimationTask.negotiator.description = taskInput.description
    estimationTask.negotiator.estimatedHours = taskInput.estimatedHours
    estimationTask.negotiator.changeSuggested = true
    estimationTask.status = SC.STATUS_PENDING
    estimationTask.addedInThisIteration = true
    estimationTask.owner = SC.OWNER_NEGOTIATOR
    estimationTask.initiallyEstimated = true
    estimationTask.estimation = taskInput.estimation
    estimationTask.technologies = estimation.technologies
    // Add repository reference and also note that this task was added into repository from this estimation
    //estimationTask.repo._id = repositoryTask._id
    estimationTask.repo.addedFromThisEstimation = true
    // Add name/description into estimator section as well, estimator can review and add estimated hours against this task
    estimationTask.estimator.name = taskInput.name
    estimationTask.estimator.description = taskInput.description
    estimationTask.feature=taskInput.feature
    if (!_.isEmpty(taskInput.notes)) {
        estimationTask.notes = taskInput.notes.map(n => {
            n.name = negotiator.fullName
            return n
        })
    }

    return await estimationTask.save()
}


estimationTaskSchema.statics.updateTaskByEstimator = async (taskInput, estimator) => {
    validate(taskInput, estimationEstimatorUpdateTaskStruct)
    if (!estimator || !userHasRole(estimator, SC.ROLE_ESTIMATOR))
        throw new AppError('Not an estimator', EC.INVALID_USER, EC.HTTP_BAD_REQUEST)

    let estimationTask = await EstimationTaskModel.findById(taskInput._id)
    if (!estimationTask)
        throw new AppError('Estimation task not found', EC.NOT_FOUND, EC.HTTP_BAD_REQUEST)

    if (estimationTask.owner == SC.OWNER_ESTIMATOR && !estimationTask.addedInThisIteration && !estimationTask.negotiator.changeSuggested && !estimationTask.negotiator.changeGranted) {
        throw new AppError('Not allowed to update task as Negotiator has not granted permission', EC.ACCESS_DENIED, EC.HTTP_BAD_REQUEST)
    } else if (estimationTask.owner == SC.OWNER_NEGOTIATOR && !estimationTask.negotiator.changeSuggested && !estimationTask.negotiator.changeGranted) {
        throw new AppError('Not allowed to update task as Negotiator has not granted permission', EC.ACCESS_DENIED, EC.HTTP_BAD_REQUEST)
    }

    let estimation = await EstimationModel.findById(estimationTask.estimation._id)
    if (!estimation)
        throw new AppError('Estimation not found', EC.NOT_FOUND, EC.HTTP_BAD_REQUEST)

    if (estimator._id.toString() != estimation.estimator._id.toString())
        throw new AppError('Invalid task for this estimation', EC.NOT_FOUND, EC.HTTP_BAD_REQUEST)

    if (!_.includes([SC.STATUS_ESTIMATION_REQUESTED, SC.STATUS_CHANGE_REQUESTED], estimation.status))
        throw new AppError("Estimation has status as [" + estimation.status + "]. Estimator can only update task into those estimations where status is in [" + SC.STATUS_ESTIMATION_REQUESTED + ", " + SC.STATUS_CHANGE_REQUESTED + "]", EC.INVALID_OPERATION, EC.HTTP_BAD_REQUEST)

    if (estimationTask.feature && estimationTask.feature._id) {
        let estimationFeatureObj = await EstimationFeatureModel.findById(estimationTask.feature._id)
        if (!estimationFeatureObj)
            throw new AppError('Feature not found', EC.NOT_FOUND, EC.HTTP_BAD_REQUEST)

        if (estimation._id.toString() != estimationFeatureObj.estimation._id.toString())
            throw new AppError('Feature not found for this estimation', EC.NOT_FOUND, EC.HTTP_BAD_REQUEST)
        if (!estimationTask.estimator.estimatedHours) {
            estimationTask.estimator.estimatedHours = 0
        }
        await EstimationFeatureModel.updateOne({_id: estimationTask.feature._id}, {$inc: {"estimator.estimatedHours": taskInput.estimatedHours - estimationTask.estimator.estimatedHours}})
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


estimationTaskSchema.statics.updateTaskByNegotiator = async (taskInput, negotiator) => {
    validate(taskInput, estimationNegotiatorUpdateTaskStruct)
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

    if (!_.includes([SC.STATUS_INITIATED, SC.STATUS_REVIEW_REQUESTED], estimation.status))
        throw new AppError("Estimation has status as [" + estimation.status + "]. Negotiator can only update task into those estimations where status is in [" + SC.STATUS_INITIATED + "," + SC.STATUS_REVIEW_REQUESTED + "]", EC.INVALID_OPERATION, EC.HTTP_BAD_REQUEST)


    /*
    if
    (estimationTask.repo && estimationTask.repo._id) {
        // find repo and update when task is updating
        let repositoryTask = await RepositoryModel.updateTask(estimationTask.repo._id, taskInput, negotiator)
    }*/

    estimationTask.feature = taskInput.feature ? taskInput.feature : estimationTask.feature ? estimationTask.feature : undefined
    estimationTask.negotiator.name = taskInput.name
    estimationTask.negotiator.description = taskInput.description
    estimationTask.negotiator.estimatedHours = taskInput.estimatedHours
    if (!estimationTask.addedInThisIteration || estimationTask.owner != SC.OWNER_NEGOTIATOR)
        estimationTask.negotiator.changedInThisIteration = true
    estimationTask.negotiator.changeSuggested = true

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
    return await estimationTask.save()

}


estimationTaskSchema.statics.getAllTaskOfEstimation = async (estimation_id) => {
    let tasksOfEstimation = await EstimationTaskModel.find({"estimation._id": estimation_id})
    return tasksOfEstimation
}

estimationTaskSchema.statics.moveTaskToFeatureByEstimator = async (taskID, featureID, estimator) => {
    if (!estimator || !userHasRole(estimator, SC.ROLE_ESTIMATOR))
        throw new AppError('Not an estimator', EC.INVALID_USER, EC.HTTP_BAD_REQUEST)

    let feature = await EstimationFeatureModel.findById(featureID)
    if (!feature)
        throw new AppError('Feature not found', EC.NOT_FOUND, EC.HTTP_BAD_REQUEST)

    let task = await EstimationTaskModel.findById(taskID)
    if (!task)
        throw new AppError('Task not found', EC.NOT_FOUND, EC.HTTP_BAD_REQUEST)

    let estimation = await EstimationModel.findOne({"_id": feature.estimation._id})
    if (!estimation)
        throw new AppError('Estimation not found', EC.NOT_FOUND, EC.HTTP_BAD_REQUEST)

    if (!_.includes([SC.STATUS_ESTIMATION_REQUESTED, SC.STATUS_CHANGE_REQUESTED], estimation.status))
        throw new AppError("Estimation has status as [" + estimation.status + "]. Estimator can only move task to feature into those estimations where status is in [" + SC.STATUS_ESTIMATION_REQUESTED + ", " + SC.STATUS_CHANGE_REQUESTED + "]", EC.INVALID_OPERATION, EC.HTTP_BAD_REQUEST)

    if (!estimation.estimator._id == estimator._id)
        throw new AppError('Not an estimator', EC.INVALID_USER, EC.HTTP_BAD_REQUEST)

    // As task is being moved to feature, estimated hours of this task would be added into estimated hours of feature (only if estimator.estimatedHours has value
    if (task.estimator.estimatedHours) {
        await EstimationFeatureModel.updateOne({_id: feature._id}, {$inc: {"estimator.estimatedHours": task.estimator.estimatedHours}})
    }

    // As task is moved please update repository as well to note this change

    //await RepositoryModel.moveTaskToFeature(task.repo._id, feature.repo._id, estimation._id)

    task.feature = feature
    task.updated = Date.now()
    if (!task.addedInThisIteration || task.owner != SC.OWNER_ESTIMATOR)
        task.estimator.changedInThisIteration = true
    task.estimator.isMovedToFeature = true
    task.estimator.isMovedOutOfFeature = false
    return await task.save()
}

estimationTaskSchema.statics.moveTaskOutOfFeatureByEstimator = async (taskID, estimator) => {
    if (!estimator || !userHasRole(estimator, SC.ROLE_ESTIMATOR))
        throw new AppError('Not an estimator', EC.INVALID_USER, EC.HTTP_BAD_REQUEST)

    let task = await EstimationTaskModel.findById(taskID)
    if (!task)
        throw new AppError('Task not found', EC.NOT_FOUND, EC.HTTP_BAD_REQUEST)

    let estimation = await EstimationModel.findOne({"_id": task.estimation._id})
    if (!estimation)
        throw new AppError('Estimation not found', EC.NOT_FOUND, EC.HTTP_BAD_REQUEST)

    if (!_.includes([SC.STATUS_ESTIMATION_REQUESTED, SC.STATUS_CHANGE_REQUESTED], estimation.status))
        throw new AppError("Estimation has status as [" + estimation.status + "]. Estimator can only update feature(Move task out of Feature) into those estimations where status is in [" + SC.STATUS_ESTIMATION_REQUESTED + ", " + SC.STATUS_CHANGE_REQUESTED + "]", EC.INVALID_OPERATION, EC.HTTP_BAD_REQUEST)

    if (!estimation.estimator._id == estimator._id)
        throw new AppError('Not an estimator', EC.INVALID_USER, EC.HTTP_BAD_REQUEST)

    console.log("task feature id is ", task.feature._id)

    // As task is moved out of feature we would have to subtract hours ($inc with minus) of this task from overall estimated hours of feature
    if (task.estimator.estimatedHours)
        await EstimationFeatureModel.updateOne({_id: task.feature._id}, {$inc: {"estimator.estimatedHours": -task.estimator.estimatedHours}})

    let feature = await EstimationFeatureModel.findById(task.feature._id)
    //await RepositoryModel.moveTaskOutOfFeature(task.repo._id, feature.repo._id, estimation._id)

    task.feature = null
    task.updated = Date.now()
    task.estimator.isMovedToFeature = false
    task.estimator.isMovedOutOfFeature = true
    if (!task.addedInThisIteration || task.owner != SC.OWNER_ESTIMATOR)
        task.estimator.changedInThisIteration = true
    return await task.save()
}

estimationTaskSchema.statics.requestRemovalTaskByEstimator = async (taskID, estimator) => {

    if (!estimator || !userHasRole(estimator, SC.ROLE_ESTIMATOR))
        throw new AppError('Not an estimator', EC.INVALID_USER, EC.HTTP_BAD_REQUEST)

    let task = await EstimationTaskModel.findById(taskID)
    if (!task)
        throw new AppError('Task not found', EC.NOT_FOUND, EC.HTTP_BAD_REQUEST)

    let estimation = await EstimationModel.findOne({"_id": task.estimation._id})
    if (!estimation)
        throw new AppError('Estimation not found', EC.NOT_FOUND, EC.HTTP_BAD_REQUEST)

    if (!_.includes([SC.STATUS_ESTIMATION_REQUESTED, SC.STATUS_CHANGE_REQUESTED], estimation.status))
        throw new AppError("Estimation has status as [" + estimation.status + "]. Estimator can only update removal task flag into those estimations where status is in [" + SC.STATUS_ESTIMATION_REQUESTED + ", " + SC.STATUS_CHANGE_REQUESTED + "]", EC.INVALID_OPERATION, EC.HTTP_BAD_REQUEST)

    if (!estimation.estimator._id == estimator._id)
        throw new AppError('Not an estimator', EC.INVALID_USER, EC.HTTP_BAD_REQUEST)

    task.estimator.removalRequested = !task.estimator.removalRequested
    task.estimator.changedInThisIteration = true

    return await task.save()

    //const updatedTask = await task.save();
    //return {removalRequested:updatedTask.estimator.removalRequested}
}


estimationTaskSchema.statics.requestEditPermissionOfTaskByEstimator = async (taskID, estimator) => {
    if (!estimator || !userHasRole(estimator, SC.ROLE_ESTIMATOR))
        throw new AppError('Not an estimator', EC.INVALID_USER, EC.HTTP_BAD_REQUEST)

    let task = await EstimationTaskModel.findById(taskID)
    if (!task)
        throw new AppError('Task not found', EC.NOT_FOUND, EC.HTTP_BAD_REQUEST)

    let estimation = await EstimationModel.findOne({"_id": task.estimation._id})
    if (!estimation)
        throw new AppError('Estimation not found', EC.NOT_FOUND, EC.HTTP_BAD_REQUEST)

    if (!_.includes([SC.STATUS_ESTIMATION_REQUESTED, SC.STATUS_CHANGE_REQUESTED], estimation.status))
        throw new AppError("Estimation has status as [" + estimation.status + "]. Estimator can only request edit task into those estimations where status is in [" + SC.STATUS_ESTIMATION_REQUESTED + ", " + SC.STATUS_CHANGE_REQUESTED + "]", EC.INVALID_OPERATION, EC.HTTP_BAD_REQUEST)

    if (!estimation.estimator._id == estimator._id)
        throw new AppError('Not an estimator', EC.INVALID_USER, EC.HTTP_BAD_REQUEST)

    task.estimator.changeRequested = !task.estimator.changeRequested
    task.estimator.changedInThisIteration = true
    return await task.save()
}

estimationTaskSchema.statics.moveTaskToFeatureByNegotiator = async (taskID, featureID, negotiator) => {
    if (!negotiator || !userHasRole(negotiator, SC.ROLE_NEGOTIATOR))
        throw new AppError('Not an negotiator', EC.INVALID_USER, EC.HTTP_BAD_REQUEST)

    let feature = await EstimationFeatureModel.findById(featureID)
    if (!feature)
        throw new AppError('Feature not found', EC.NOT_FOUND, EC.HTTP_BAD_REQUEST)

    let task = await EstimationTaskModel.findById(taskID)
    if (!task)
        throw new AppError('Task not found', EC.NOT_FOUND, EC.HTTP_BAD_REQUEST)

    let estimation = await EstimationModel.findOne({"_id": feature.estimation._id})
    if (!estimation)
        throw new AppError('Estimation not found', EC.NOT_FOUND, EC.HTTP_BAD_REQUEST)

    if (!_.includes([SC.STATUS_INITIATED, SC.STATUS_REVIEW_REQUESTED], estimation.status))
        throw new AppError("Estimation has status as [" + estimation.status + "]. Negotiator can only move task to feature into those estimations where status is in [" + SC.STATUS_INITIATED + ", " + SC.STATUS_REVIEW_REQUESTED + "]", EC.INVALID_OPERATION, EC.HTTP_BAD_REQUEST)

    if (!estimation.negotiator._id == negotiator._id)
        throw new AppError('Not an negotiator', EC.INVALID_USER, EC.HTTP_BAD_REQUEST)

    // As task is being moved to feature, estimated hours of this task would be added into estimated hours of feature (only if estimator.estimatedHours has value
    if (task.estimator.estimatedHours) {
        await EstimationFeatureModel.updateOne({_id: feature._id}, {$inc: {"estimator.estimatedHours": task.estimator.estimatedHours}})
    }

    //await RepositoryModel.moveTaskToFeature(task.repo._id, feature.repo._id, estimation._id)

    task.feature = feature
    task.updated = Date.now()
    if (!task.addedInThisIteration || task.owner != SC.OWNER_NEGOTIATOR)
        task.negotiator.changedInThisIteration = true
    task.negotiator.isMovedToFeature = true
    task.negotiator.isMovedOutOfFeature = false

    return await task.save()
}

estimationTaskSchema.statics.deleteTaskByEstimator = async (paramsInput, estimator) => {
    //console.log("deleteTaskByEstimator for paramsInput ", paramsInput)
    if (!estimator || !userHasRole(estimator, SC.ROLE_ESTIMATOR))
        throw new AppError('Not an estimator', EC.INVALID_USER, EC.HTTP_BAD_REQUEST)

    let task = await EstimationTaskModel.findById(paramsInput.taskID)
    if (!task)
        throw new AppError('Task not found', EC.NOT_FOUND, EC.HTTP_BAD_REQUEST)

    let estimation = await EstimationModel.findOne({"_id": paramsInput.estimationID})
    if (!estimation)
        throw new AppError('Estimation not found', EC.NOT_FOUND, EC.HTTP_BAD_REQUEST)

    if (estimation.estimator._id != estimator._id)
        throw new AppError('Not an estimator', EC.INVALID_USER, EC.HTTP_BAD_REQUEST)

    if (task.owner != SC.OWNER_ESTIMATOR)
        throw new AppError('You are not owner of this task', EC.ACCESS_DENIED, EC.HTTP_BAD_REQUEST)

    if (!task.addedInThisIteration)
        throw new AppError('You are not allowed to delete this task', EC.ACCESS_DENIED, EC.HTTP_BAD_REQUEST)

    if (task.feature && task.feature._id) {
        let feature = await EstimationFeatureModel.findById(task.feature._id)
        if (!feature)
            throw new AppError('Feature that this task is associated with is not found', EC.NOT_FOUND, EC.HTTP_BAD_REQUEST)

        // As task is removed we have to subtract hours ($inc with minus) of this task from overall estimated hours of feature
        if (task.estimator.estimatedHours)
            await EstimationFeatureModel.updateOne({_id: feature._id}, {$inc: {"estimator.estimatedHours": -task.estimator.estimatedHours}})

    }
    task.isDeleted = true
    task.estimator.changedInThisIteration = true
    task.updated = Date.now()
    return await task.save()
}
estimationTaskSchema.statics.deleteTaskByNegotiator = async (paramsInput, negotiator) => {

    if (!negotiator || !userHasRole(negotiator, SC.ROLE_NEGOTIATOR))
        throw new AppError('Not an negotiator', EC.INVALID_USER, EC.HTTP_BAD_REQUEST)

    let task = await EstimationTaskModel.findById(paramsInput.taskID)

    console.log("task filtered",task)

    if (!task)
        throw new AppError('Task not found', EC.NOT_FOUND, EC.HTTP_BAD_REQUEST)

    let estimation = await EstimationModel.findOne({"_id": paramsInput.estimationID})
    if (!estimation)
        throw new AppError('Estimation not found', EC.NOT_FOUND, EC.HTTP_BAD_REQUEST)

    if (estimation.negotiator._id != negotiator._id)
        throw new AppError('Not an negtotiator', EC.INVALID_USER, EC.HTTP_BAD_REQUEST)


    if(!task.estimator.removalRequested){

        if (task.owner != SC.OWNER_NEGOTIATOR)
            throw new AppError('You are not owner of this task', EC.ACCESS_DENIED, EC.HTTP_BAD_REQUEST)

      /*  if (!task.addedInThisIteration)
            throw new AppError('You are not allowed to delete this task', EC.ACCESS_DENIED, EC.HTTP_BAD_REQUEST)*/
    }



    if (task.feature && task.feature._id) {
        let feature = await EstimationFeatureModel.findById(task.feature._id)
        if (!feature)
            throw new AppError('Feature that this task is associated with is not found', EC.NOT_FOUND, EC.HTTP_BAD_REQUEST)

        // As task is removed we have to subtract hours ($inc with minus) of this task from overall estimated hours of feature
        if (task.negotiator.estimatedHours)
            await EstimationFeatureModel.updateOne({_id: feature._id}, {$inc: {"negotiator.estimatedHours": -task.negotiator.estimatedHours}})

    }
    task.isDeleted = true
    task.negotiator.changedInThisIteration = true
    task.updated = Date.now()
    return await task.save()
}

estimationTaskSchema.statics.moveTaskOutOfFeatureByNegotiator = async (taskID, negotiator) => {
    if (!negotiator || !userHasRole(negotiator, SC.ROLE_NEGOTIATOR))
        throw new AppError('Not an negotiator', EC.INVALID_USER, EC.HTTP_BAD_REQUEST)

    let task = await EstimationTaskModel.findById(taskID)
    if (!task)
        throw new AppError('Task not found', EC.NOT_FOUND, EC.HTTP_BAD_REQUEST)

    let feature = await EstimationFeatureModel.findById(task.feature._id)
    if (!feature)
        throw new AppError('Feature not found', EC.NOT_FOUND, EC.HTTP_BAD_REQUEST)

    let estimation = await EstimationModel.findOne({"_id": feature.estimation._id})
    if (!estimation)
        throw new AppError('Estimation not found', EC.NOT_FOUND, EC.HTTP_BAD_REQUEST)

    if (!_.includes([SC.STATUS_INITIATED, SC.STATUS_REVIEW_REQUESTED], estimation.status))
        throw new AppError("Estimation has status as [" + estimation.status + "]. Negotiator can only update feature(Move task out of feature) into those estimations where status is in [" + SC.STATUS_INITIATED + ", " + SC.STATUS_REVIEW_REQUESTED + "]", EC.INVALID_OPERATION, EC.HTTP_BAD_REQUEST)

    if (!estimation.negotiator._id == negotiator._id)
        throw new AppError('Not an negotiator', EC.INVALID_USER, EC.HTTP_BAD_REQUEST)

    // As task is moved out of feature we would have to subtract hours ($inc with minus) of this task from overall estimated hours of feature
    if (task.estimator.estimatedHours)
        await EstimationFeatureModel.updateOne({_id: feature._id}, {$inc: {"estimator.estimatedHours": -task.estimator.estimatedHours}})

    //await RepositoryModel.moveTaskOutOfFeature(task.repo._id, feature.repo._id, estimation._id)

    task.feature = null
    task.updated = Date.now()
    task.negotiator.isMovedToFeature = false
    task.negotiator.isMovedOutOfFeature = true
    if (!task.addedInThisIteration || task.owner != SC.OWNER_NEGOTIATOR)
        task.negotiator.changedInThisIteration = true
    return await task.save()
}


estimationTaskSchema.statics.grantEditPermissionOfTaskByNegotiator = async (taskID, negotiator) => {

    if (!negotiator || !userHasRole(negotiator, SC.ROLE_NEGOTIATOR))
        throw new AppError('Not an negotiator', EC.INVALID_USER, EC.HTTP_BAD_REQUEST)

    let task = await EstimationTaskModel.findById(taskID)
    if (!task)
        throw new AppError('Task not found', EC.NOT_FOUND, EC.HTTP_BAD_REQUEST)

    let estimation = await EstimationModel.findOne({"_id": task.estimation._id})
    if (!estimation)
        throw new AppError('Estimation not found', EC.NOT_FOUND, EC.HTTP_BAD_REQUEST)

    if (!_.includes([SC.STATUS_INITIATED, SC.STATUS_REVIEW_REQUESTED], estimation.status))
        throw new AppError("Estimation has status as [" + estimation.status + "]. Negotiator can only given grant edit permission to task into those estimations where status is in [" + SC.STATUS_INITIATED + ", " + SC.STATUS_REVIEW_REQUESTED + "]", EC.INVALID_OPERATION, EC.HTTP_BAD_REQUEST)

    if (!estimation.negotiator._id == negotiator._id)
        throw new AppError('Not an negotiator', EC.INVALID_USER, EC.HTTP_BAD_REQUEST)

    if (!task.addedInThisIteration || task.owner != SC.OWNER_NEGOTIATOR)
        task.negotiator.changedInThisIteration = true

    task.negotiator.changeGranted = !task.negotiator.changeGranted
    task.updated = Date.now()
    return await task.save()
}

estimationTaskSchema.statics.approveTaskByNegotiator = async (taskID, negotiator) => {

    if (!negotiator || !userHasRole(negotiator, SC.ROLE_NEGOTIATOR))
        throw new AppError('Not a negotiator', EC.INVALID_USER, EC.HTTP_BAD_REQUEST)

    let task = await EstimationTaskModel.findById(taskID)

    if (!task)
        throw new AppError('Task not found', EC.NOT_FOUND, EC.HTTP_BAD_REQUEST)

    if (task.status == SC.STATUS_APPROVED)
        throw new AppError('Task already approved', EC.INVALID_OPERATION, EC.HTTP_BAD_REQUEST)

    let estimation = await EstimationModel.findOne({"_id": task.estimation._id})
    if (!estimation)
        throw new AppError('Estimation not found', EC.NOT_FOUND, EC.HTTP_BAD_REQUEST)

    if (estimation.negotiator._id != negotiator._id)
        throw new AppError('You are not a negotiator of estimation this task is part of', EC.INVALID_USER, EC.HTTP_BAD_REQUEST)

    if (!_.includes([SC.STATUS_REVIEW_REQUESTED], estimation.status))
        throw new AppError("Estimation has status as [" + estimation.status + "]. Negotiator can only approve task into those estimations where status is in [" + SC.STATUS_REVIEW_REQUESTED + "]", EC.INVALID_OPERATION, EC.HTTP_BAD_REQUEST)

    if (task.estimator.changeRequested
        || task.estimator.removalRequested
        || (!task.estimator.estimatedHours || task.estimator.estimatedHours == 0)
        || _.isEmpty(task.estimator.name)
        || _.isEmpty(task.estimator.description))
        throw new AppError('Cannot approve task as either name/description is not not there or there are pending requests from Estimator', EC.INVALID_OPERATION, EC.HTTP_FORBIDDEN)

    task.status = SC.STATUS_APPROVED
    task.updated = Date.now()
    return await task.save()
}


estimationTaskSchema.statics.addTaskFromRepositoryByEstimator = async (estimationID, repositoryTaskID, estimator) => {

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
        "estimation._id": estimation._id
    })
    if (thisTaskWithRepoAlreadyExist)
        throw new AppError('This task is already part of estimation', EC.ALREADY_EXISTS, EC.HTTP_BAD_REQUEST)

    let estimationTask = new EstimationTaskModel()
    // As task is added from repository its information can directly be copied into estimator section (even if it is being added by negotiator)
    estimationTask.estimator.name = repositoryTask.name
    estimationTask.estimator.description = repositoryTask.description
    estimationTask.status = SC.STATUS_PENDING
    estimationTask.addedInThisIteration = true
    estimationTask.owner = SC.OWNER_ESTIMATOR
    estimationTask.initiallyEstimated = true
    estimationTask.estimation = estimation
    estimationTask.technologies = estimation.technologies
    estimationTask.repo._id = repositoryTask._id
    estimationTask.repo.addedFromThisEstimation = false

    return await estimationTask.save()

}

estimationTaskSchema.statics.copyTaskFromRepositoryByEstimator = async (estimationID, repositoryTaskID, estimator) => {

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
        "estimation._id": estimation._id
    })
    if (thisTaskWithRepoAlreadyExist)
        throw new AppError('This task is already part of estimation', EC.ALREADY_EXISTS, EC.HTTP_BAD_REQUEST)



    let estimationTask = new EstimationTaskModel()
    // As task is added from repository its information can directly be copied into estimator section (even if it is being added by negotiator)
    estimationTask.estimator.name = repositoryTask.name
    estimationTask.estimator.description = repositoryTask.description
    estimationTask.status = SC.STATUS_PENDING
    estimationTask.addedInThisIteration = true
    estimationTask.owner = SC.OWNER_ESTIMATOR
    estimationTask.initiallyEstimated = true
    estimationTask.estimation = estimation
    estimationTask.technologies = estimation.technologies
    //estimationTask.repo._id = repositoryTask._id
    //estimationTask.repo.addedFromThisEstimation = false

    return await estimationTask.save()

}

estimationTaskSchema.statics.addTaskFromRepositoryByNegotiator = async (estimationID, repositoryTaskID, negotiator) => {

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
        "estimation._id": estimation._id
    })
    if (checkExistsCount > 0)
        throw new AppError('This task from repository already added', EC.ALREADY_EXISTS, EC.HTTP_BAD_REQUEST)

    // As task is added from repository its information can directly be copied into estimator section (even if it is being added by negotiator)
    let taskFromRepositoryObj = new EstimationTaskModel()
    taskFromRepositoryObj.estimator.name = repositoryTask.name
    taskFromRepositoryObj.estimator.description = repositoryTask.description
    taskFromRepositoryObj.status = SC.STATUS_PENDING
    taskFromRepositoryObj.addedInThisIteration = true
    taskFromRepositoryObj.owner = SC.OWNER_NEGOTIATOR
    taskFromRepositoryObj.initiallyEstimated = true

    taskFromRepositoryObj.estimation = estimation
    taskFromRepositoryObj.technologies = estimation.technologies
    taskFromRepositoryObj.repo._id = repositoryTask._id
    taskFromRepositoryObj.repo.addedFromThisEstimation = false
    return await EstimationTaskModel.create(taskFromRepositoryObj)
}

estimationTaskSchema.statics.copyTaskFromRepositoryByNegotiator = async (estimationID, repositoryTaskID, negotiator) => {

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
        "estimation._id": estimation._id
    })
    if (checkExistsCount > 0)
        throw new AppError('This task from repository already added', EC.ALREADY_EXISTS, EC.HTTP_BAD_REQUEST)

    // As task is added from repository its information can directly be copied into estimator section (even if it is being added by negotiator)
    let taskFromRepositoryObj = new EstimationTaskModel()
    taskFromRepositoryObj.estimator.name = repositoryTask.name
    taskFromRepositoryObj.estimator.description = repositoryTask.description
    taskFromRepositoryObj.status = SC.STATUS_PENDING
    taskFromRepositoryObj.addedInThisIteration = true
    taskFromRepositoryObj.owner = SC.OWNER_NEGOTIATOR
    taskFromRepositoryObj.initiallyEstimated = true

    taskFromRepositoryObj.estimation = estimation
    taskFromRepositoryObj.technologies = estimation.technologies
    //taskFromRepositoryObj.repo._id = repositoryTask._id
    //taskFromRepositoryObj.repo.addedFromThisEstimation = false
    return await EstimationTaskModel.create(taskFromRepositoryObj)
}

const EstimationTaskModel = mongoose.model("EstimationTask", estimationTaskSchema)
export default EstimationTaskModel
