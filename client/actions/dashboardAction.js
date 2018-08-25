import * as A from '../actions'
import * as AC from "./actionConsts";


export const calculateReleaseStats = (release) => ({
    type: AC.CALCULATE_RELEASE_STATS,
    release: release
})

export const addReleaseDailyPlannings = (dailyPlannings, resetDailyPlanningMonth) => ({
    type: AC.ADD_DAILY_PLANNINGS,
    dailyPlannings: dailyPlannings,
    resetDailyPlanningMonth: resetDailyPlanningMonth ? true : false
})


export const getReleaseForDashboard = (releaseID) => {
    console.log("releaseID", releaseID)
    return function (dispatch) {
        return fetch('/api/releases/release/' + releaseID,
            {
                method: "get",
                credentials: "include",
                headers: {
                    'Accept': 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            }
        ).then(
            response => {
                return response.json()
            }
        ).then(json => {
                if (json.success) {
                    dispatch(calculateReleaseStats(json.data))
                }
                return json
            }
        )
    }
}

export const getReleaseDayPlannings = (releaseID, month, year, resetDailyPlanningMonth) => {
    return function (dispatch) {
        return fetch('/api/dashboard/day-plannings/' + releaseID + '/month/' + month + '/year/' + year,
            {
                method: "get",
                credentials: "include",
                headers: {
                    'Accept': 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            }
        ).then(
            response => {
                return response.json()
            }
        ).then(json => {
                if (json.success) {
                    dispatch(addReleaseDailyPlannings(json.data, resetDailyPlanningMonth))
                }
                return json
            }
        )
    }
}


