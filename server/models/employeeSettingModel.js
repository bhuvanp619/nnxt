import mongoose from 'mongoose'
import AppError from '../AppError'
import * as SC from '../serverconstants'
import * as EC from '../errorcodes'
import {userHasRole} from "../utils"

mongoose.Promise = global.Promise

let employeeSettingSchema = mongoose.Schema({

    maxPlannedHours: {type: Number, default: 8},
    minPlannedHours: {type: Number, default: 4},
    free: {type: Number, default: 2},
    relativelyFree: {type: Number, default: 4},
    busy: {type: Number, default: 6},
    superBusy: {type: Number, default: 8}

})

/**
 * Employee Setting is Created by Admin
 * @param employeeSettingInput
 */
employeeSettingSchema.statics.createEmployeeSettings = async (employeeSettingInput, admin) => {
    if (!admin || !userHasRole(admin, SC.ROLE_ADMIN))
        throw new AppError('Not a Admin', EC.INVALID_USER, EC.HTTP_BAD_REQUEST)

    return await EmployeeSettingModel.create(employeeSettingInput)
}
/**
 * Employee Setting is fetched
 */
employeeSettingSchema.statics.getEmployeeSettings = async (admin) => {
    if (!admin || !userHasRole(admin, SC.ROLE_ADMIN))
        throw new AppError('Not a Admin', EC.INVALID_USER, EC.HTTP_BAD_REQUEST)

    let employeeSettings = await EmployeeSettingModel.find({})
    return employeeSettings && employeeSettings.length ? employeeSettings[0] : {}
}
/**
 * Employee Setting is updated by Admin
 * @param employeeSettingInput
 */
employeeSettingSchema.statics.updateEmployeeSettings = async (employeeSettingInput, admin) => {
    if (!admin || !userHasRole(admin, SC.ROLE_ADMIN))
        throw new AppError('Not a Admin', EC.INVALID_USER, EC.HTTP_BAD_REQUEST)

    let employeeSetting = await EmployeeSettingModel.findById(mongoose.Types.ObjectId(employeeSettingInput._id))
    if (!employeeSetting) {
        throw new AppError('employeeSetting  not found', EC.NOT_FOUND, EC.HTTP_BAD_REQUEST)
    }
    employeeSetting.maxPlannedHours = employeeSettingInput.maxPlannedHours
    employeeSetting.minPlannedHours = employeeSettingInput.minPlannedHours
    employeeSetting.free = employeeSettingInput.free
    employeeSetting.relativelyFree = employeeSettingInput.relativelyFree
    employeeSetting.busy = employeeSettingInput.busy
    employeeSetting.superBusy = employeeSettingInput.superBusy
    return await employeeSetting.save()
}


const EmployeeSettingModel = mongoose.model("employeeSetting", employeeSettingSchema)
export default EmployeeSettingModel