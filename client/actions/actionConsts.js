/*----------------------------- ACTION CONSTANTS -----------------------------*/


//LOGIN CONSTANTS
export const ADD_LOGIN_USER = "ADD_LOGIN_USER"
export const LOGIN_FAILED = "LOGIN_FAILED"

//SYSYTEM CONSTANTS
export const SHOW_COMPONENT_HIDE_OTHER = "SHOW_COMPONENT_HIDE_OTHER"
export const SHOW_COMPONENT = "SHOW_COMPONENT"
export const HIDE_COMPONENT = "HIDE_COMPONENT"
export const ADD_SSR_FLAG = "ADD_SSR_FLAG"
export const CLEAR_SSR_FLAG = "CLEAR_SSR_FLAG"
export const SHOW_LOADER = "SHOW_LOADER"
export const HIDE_LOADER = "HIDE_LOADER"
export const SET_SCREEN_SIZE = "SET_SCREEN_SIZE"


//PERMISSIONS CONSTANTS
export const ADD_PERMISSIONS = "ADD_PERMISSIONS"
export const ADD_PERMISSION = "ADD_PERMISSION"
export const EDIT_PERMISSION = "EDIT_PERMISSION"
export const DELETE_PERMISSION = "DELETE_PERMISSION"

//ROLES CONSTANTS
export const ADD_ROLES = "ADD_ROLES"
export const ADD_ROLE = "ADD_ROLE"
export const EDIT_ROLE = "EDIT_ROLE"
export const DELETE_ROLE = "DELETE_ROLE"

//USER CONSTANTS
export const ADD_USERS = "ADD_USERS"
export const ADD_USERS_WITH_ROLE_CATEGORY = "ADD_USERS_WITH_ROLE_CATEGORY"
export const ADD_USERS_WITH_ROLE_DEVELOPER = "ADD_USERS_WITH_ROLE_DEVELOPER"
export const ADD_DEVELOPERS_TO_STATE = "ADD_DEVELOPERS_TO_STATE"
export const ADD_USER = "ADD_USER"
export const EDIT_USER = "EDIT_USER"
export const DELETE_USER = "DELETE_USER"
export const ADD_ADMIN_USER = "ADD_ADMIN_USER"
export const UPDATE_ADMIN_USER = "UPDATE_ADMIN_USER"
export const DELETE_ADMIN_USER = "DELETE_ADMIN_USER"
export const ADMIN_EDITING_ROLE = "ADMIN_EDITING_ROLE"
export const ADD_CLIENTS = "ADD_CLIENTS"
export const ADD_CLIENT = "ADD_CLIENT"
export const UPDATE_CLIENT = "UPDATE_CLIENT"
export const DELETE_CLIENT = "DELETE_CLIENT"
export const UPDATE_TOGGLE_CLIENT = "UPDATE_TOGGLE_CLIENT"


//ESTIMATION CONSTANTS
export const ADD_ESTIMATIONS = "ADD_ESTIMATIONS"
export const ADD_ESTIMATION = "ADD_ESTIMATION"
export const EDIT_ESTIMATION = "EDIT_ESTIMATION"
export const DELETE_ESTIMATION = "DELETE_ESTIMATION"
export const SELECT_ESTIMATION = "SELECT_ESTIMATION"
export const ADD_ESTIMATION_TASK = "ADD_ESTIMATION_TASK"
export const UPDATE_ESTIMATION_TASK = "UPDATE_ESTIMATION_TASK"
export const ADD_ESTIMATION_FEATURE = "ADD_ESTIMATION_FEATURE"
export const UPDATE_ESTIMATION_FEATURE = "UPDATE_ESTIMATION_FEATURE"
export const MOVE_TASK_IN_FEATURE = "MOVE_TASK_IN_FEATURE"
export const MOVE_TASK_OUTOF_FEATURE = "MOVE_TASK_OUTOF_FEATURE"
export const UPDATE_SELECTED_ESTIMATION = "UPDATE_SELECTED_ESTIMATION"

export const ESTIMATION_TASK_DELETE = "ESTIMATION_TASK_DELETE"
export const REQUEST_FOR_TASK_EDIT_PERMISSION = "REQUEST_FOR_TASK_EDIT_PERMISSION"
export const DELETE_ESTIMATION_TASK = "DELETE_ESTIMATION_TASK"
export const DELETE_ESTIMATION_FEATURE = "DELETE_ESTIMATION_FEATURE"
export const UPDATE_USER_PROFILE_STATE = "UPDATE_USER_PROFILE_STATE"
export const EXPAND_FEATURE = "EXPAND_FEATURE"
export const EXPAND_TASK = "EXPAND_TASK"
export const EXPAND_TASK_AND_FEATURE = "EXPAND_TASK_AND_FEATURE"
export const ADD_FILTERED_ESTIMATIONS = "ADD_FILTERED_ESTIMATIONS"
export const CLEAR_FILTER_FROM_ESTIMATION = "CLEAR_FILTER_FROM_ESTIMATION"
export const SELECT_ALL_FILTER_FROM_ESTIMATION = "SELECT_ALL_FILTER_FROM_ESTIMATION"

//project constants
export const ADD_PROJECTS = "ADD_PROJECTS"
export const ADD_PROJECT = "ADD_PROJECT"
export const EDIT_PROJECT = "EDIT_PROJECT"
export const DELETE_PROJECT = "DELETE_PROJECT"
export const UPDATE_PROJECT = "UPDATE_PROJECT"

//module constants
export const ADD_MODULES = "ADD_MODULES"
export const ADD_MODULE = "ADD_MODULE"
export const EDIT_MODULE = "EDIT_MODULE "
export const DELETE_MODULE = "DELETE_MODULE "

//TECHNOLOGY CONSTANTS
export const ADD_TECHNOLOGIES = "ADD_TECHNOLOGIES"
export const ADD_TECHNOLOGY = "ADD_TECHNOLOGY"
export const DELETE_TECHNOLOGY = "DELETE_TECHNOLOGY"

//LEAVE CONSTANTS
export const ADD_LEAVE_TYPES = "ADD_LEAVE_TYPES"
export const ADD_LEAVES = "ADD_LEAVES"
export const LEAVE_SELECTED = "LEAVE_SELECTED"
export const ADD_LEAVE = "ADD_LEAVE"
export const UPDATE_LEAVE = "UPDATE_LEAVE"
export const REVOKE_LEAVE = "REVOKE_LEAVE"

//RELEASE CONSTANTS
export const ADD_AVAILABLE_RELEASES = "ADD_AVAILABLE_RELEASES"
export const ADD_RELEASES = "ADD_RELEASES"
export const RELEASE_SELECTED = "RELEASE_SELECTED"
export const ADD_RELEASE = "ADD_RELEASE"
export const ADD_RELEASE_PLANS = "ADD_RELEASE_PLANS"
export const RELEASE_PLAN_SELECTED = "RELEASE_PLAN_SELECTED"
export const ADD_RELEASE_TASK_PLANNINGS = "ADD_RELEASE_TASK_PLANNINGS"
export const DELETE_TASK_PLAN = "DELETE_TASK_PLAN"
export const ADD_DEVELOPER_FILTERED = "ADD_DEVELOPER_FILTERED"
export const UPDATE_DEVELOPER_FILTERED = "UPDATE_DEVELOPER_FILTERED"
export const ADD_RELEASE_TASK_PLANNING_TO_STATE = "ADD_RELEASE_TASK_PLANNING_TO_STATE"
export const UPDATE_TASK_PLANNING = "UPDATE_TASK_PLANNING"
export const UPDATE_TASK_PLANS = "UPDATE_TASK_PLANS"
export const EXPAND_DESCRIPTION = "EXPAND_DESCRIPTION"
export const EXPAND_DESCRIPTION_TASK_LIST = "EXPAND_DESCRIPTION_TASK_LIST"
export const SET_DEVELOPERS_SCHEDULE = "SET_DEVELOPERS_SCHEDULE"
export const SET_FROM_DATE = "SET_FROM_DATE"
export const UPDATE_RELEASE_PLAN = "UPDATE_RELEASE_PLAN"
export const ADD_TASK_PLANNINGS = "ADD_TASK_PLANNINGS"
export const UPDATE_RELEASE_DATES = "UPDATE_RELEASE_DATES"
export const RELEASE_TAB_SELECTED = "RELEASE_TAB_SELECTED"
export const ITERATION_SELECTED = "ITERATION_SELECTED"

//REPOSITORY CONSTANTS
export const SELECT_REPOSITORY = "SELECT_REPOSITORY"
export const SELECT_TASK_FROM_REPOSITORY = "SELECT_TASK_FROM_REPOSITORY"
export const SELECT_FEATURE_FROM_REPOSITORY = "SELECT_FEATURE_FROM_REPOSITORY"

//ATTENDANCE CONSTANTS
export const ADD_UPDATE_ATTENDANCE_SETTING = "ADD_UPDATE_ATTENDANCE_SETTING"

//REPORTING CONSTANTS
export const CHANGE_CALENDAR_NAVIGATION = "CHANGE_CALENDAR_NAVIGATION"
export const SHOW_USERS_TASKS = "SHOW_USERS_TASKS"
export const SET_CALENDAR_TASK_DETAILS = "SET_CALENDAR_TASK_DETAILS"

//REPORTING CONSTANTS
export const ADD_USER_RELEASES = "ADD_USER_RELEASES"
export const ADD_RELEASES_AND_TASKS_OF_SELECTED_DATE = "ADD_RELEASES_AND_TASKS_OF_SELECTED_DATE"
export const RELEASE_SELECTED_FOR_REPORTING = "RELEASE_SELECTED_FOR_REPORTING"
export const NO_PROJECT_SELECTED = "NO_PROJECT_SELECTED"
export const REPORT_TASK_SELECTED = "REPORT_TASK_SELECTED"
export const ADD_TASK_COMMENT = "ADD_TASK_COMMENT"
export const SET_STATUS = "SET_STATUS"
export const SET_REPORT_DATE = "SET_REPORT_DATE"
export const SET_RELEASE_ID = "SET_RELEASE_ID"
export const SET_ITERATION_TYPE = "SET_ITERATION_TYPE"
export const UPDATE_SELECTED_TASK_PLAN = "UPDATE_SELECTED_TASK_PLAN"
export const UPDATE_SELECTED_RELEASE_PLAN = "UPDATE_SELECTED_RELEASE_PLAN"
export const SET_REPORTS_OF_RELEASE = "SET_REPORTS_OF_RELEASE"
export const TASK_REPORTED = "TASK_REPORTED"

//WARNING CONSTANTS
export const ADD_WARNINGS = "ADD_WARNINGS"

//HOLIDAY CONSTANTS
export const ADD_HOLIDAY = "ADD_HOLIDAY"
export const ADD_HOLIDAYS = "ADD_HOLIDAYS"
export const ADD_ALL_YEARS = "ADD_ALL_YEARS"
export const DELETE_HOLIDAY = "DELETE_HOLIDAY"
export const UPDATE_HOLIDAY = "UPDATE_HOLIDAY"


//EMPLOYEE CONSTANTS
export const SET_EMPLOYEE_SETTINGS = "SET_EMPLOYEE_SETTINGS"
export const ADD_WORK_CALENDAR = "ADD_WORK_CALENDAR"

// DEVELOPMENT TYPE
export const ADD_DEVELOPMENT_TYPES = "ADD_DEVELOPMENT_TYPES"
export const ADD_DEVELOPMENT_TYPE = "ADD_DEVELOPMENT_TYPE"
export const DELETE_DEVELOPMENT_TYPE = "DELETE_DEVELOPMENT_TYPE"

export const CALCULATE_RELEASE_STATS = "CALCULATE_RELEASE_STATS"
export const ADD_DAILY_PLANNINGS = "ADD_DAILY_PLANNINGS"
export const SET_PLANNING_MONTH = "SET_PLANNING_MONTH"

// Search forms actions
export const SEARCH_TASK_PLANS_IN_RELEASE = "SEARCH_TASK_PLANS_IN_RELEASE"
export const EXPAND_DESCRIPTION_TASK_REPORT_LIST = "EXPAND_DESCRIPTION_TASK_REPORT_LIST"
export const EXPAND_DESCRIPTION_RELEASE_PLAN_LIST = "EXPAND_DESCRIPTION_RELEASE_PLAN_LIST"
export const CHANGE_RELEASEPLAN_FILTERS = "CHANGE_RELEASEPLAN_FILTERS"
export const CHANGE_RELEASE_FILTERS = "CHANGE_RELEASE_FILTERS"

