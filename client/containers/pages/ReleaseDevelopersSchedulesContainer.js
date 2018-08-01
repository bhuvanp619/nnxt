import {connect} from 'react-redux'
import {ReleaseDevelopersSchedules} from '../../components'
import * as COC from '../../components/componentConsts'
import * as A from '../../actions'

const mapDispatchToProps = (dispatch, ownProps) => ({
    getEmployeeSettings: () => dispatch(A.getEmployeeSettingFromServer()),
    dispatch
})


const mapStateToProps = (state) => ({
    schedules: state.release.schedules,
    workCalendar: state.employee.workCalendar,
    from: state.release.from,
    employeeSetting: state.release.employeeSetting
})

const ReleaseDevelopersSchedulesContainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(ReleaseDevelopersSchedules)

export default ReleaseDevelopersSchedulesContainer
