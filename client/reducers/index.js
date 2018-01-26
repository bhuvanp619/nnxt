import {combineReducers} from 'redux'
import {reducer as formReducer} from 'redux-form'
import userReducer from './userReducer'
import appReducer from './appReducer'
import permissionReducer from './permissionReducer'
import roleReducer from './roleReducer'
import clientReducer from './clientReducer'
import estimationReducer from './estimationReducer'

const reducers = combineReducers({
    form: formReducer, // Redux form state
    user: userReducer,
    app: appReducer,
    permission: permissionReducer,
    role: roleReducer,
    client: clientReducer,
    estimation: estimationReducer
})
export default reducers