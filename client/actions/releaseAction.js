import * as AC from './actionConsts'


export const addReleases = (releases) => ({
    type: AC.ADD_RELEASES,
    releases: releases
})

export const getAllReleaseFromServer = () => {
    return (dispatch, getState) => {
        return fetch('/api/releases', {
                method: 'get',
                credentials: "include",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            }
        ).then(
            response => response.json()
        ).then(
            json => {
                if (json.success) {
                    console.log("json data", json.data)
                      dispatch(addReleases(json.data))
                }
            })
    }
}
