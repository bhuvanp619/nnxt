import mongoose from 'mongoose'
import AppError from '../AppError'
import {ClientModel} from "./"
import * as ErrorCodes from '../errorcodes'
import {projectAdditionStruct, validate} from "../validation"

mongoose.Promise = global.Promise

let projectSchema = mongoose.Schema({
    name: {
        type: String, required: [true, 'Project name is required']
    },
    client: {
        _id: mongoose.Schema.ObjectId,
        name: String
    },
    isDeleted: {type: Boolean, default: false}
})

projectSchema.statics.saveProject = async projectInput => {
    validate(projectInput, projectAdditionStruct)
    if (await ProjectModel.exists(projectInput.name, projectInput.client._id))
        throw new AppError("Project with name [" + projectInput.name + "] already exists under this client", ErrorCodes.ALREADY_EXISTS, ErrorCodes.HTTP_BAD_REQUEST)

    let client = await ClientModel.findById(projectInput.client._id)
    if (!client)
        throw new AppError("No such client", ErrorCodes.NOT_FOUND, ErrorCodes.HTTP_BAD_REQUEST)

    projectInput.client = client
    return await ProjectModel.create(projectInput)
}

projectSchema.statics.exists = async (name, clientId) => {
    if (!name || !clientId)
        throw new AppError("ProjectModel->exists() method needs non-null name/clientId parameter", ErrorCodes.BAD_ARGUMENTS)
    let count = await ProjectModel.count({'name': name, 'client._id': clientId})
    if (count > 0)
        return true
    return false
}

const ProjectModel = mongoose.model("Project", projectSchema)
export default ProjectModel
