import * as AC from "./actionConsts"


export const addLeaveRequests = (leaveRequests) => ({
    type: AC.ADD_LEAVE_REQUESTS,
    leaveRequests: leaveRequests
})

export const addLeaveRequest = (leaveRequest) => ({
    type: AC.ADD_LEAVE_REQUEST,
    leaveRequest: leaveRequest
})

export const addLeaveRequestOnServer = (formInput) => {
    return function (dispatch, getState) {
        return fetch('/api/leave/require',
            {
                method: "post",
                credentials: "include",
                headers: {
                    'Accept': 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formInput)
            }
        ).then(
            response => {
                return response.json()
            }
        ).then(json => {
                if (json.success) {
                    dispatch(addLeaveRequest(json.data))
                }

                return json
            }
        )
    }
}