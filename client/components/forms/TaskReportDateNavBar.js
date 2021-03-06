import React, {Component} from 'react'
import {Field, formValueSelector, reduxForm} from 'redux-form'
import {renderDateTimePickerString, renderSelect,} from './fields'
import moment from 'moment'
import momentLocalizer from 'react-widgets-moment'
import {connect} from 'react-redux'
import * as SC from '../../../server/serverconstants'
import momentTZ from "moment-timezone";
import {DATE_FORMAT} from "../../../server/serverconstants";

moment.locale('en')

class TaskReportDateNavBar extends Component {

    constructor(props) {
        super(props)
        this.state = {
            expandDescription: false
        }

    }

    componentDidMount() {
        // On task plan load view user would be shown tasks of today's day and beyond
        console.log("componentDidMount ", this.props)
        this.props.fetchTaskReports({
            releaseID: this.props.releaseID,
            startDate: this.props.initialValues.startDate,
            endDate: this.props.initialValues.endDate
        })


        this.handleExpandDescriptionCheckBox = this.handleExpandDescriptionCheckBox.bind(this);
    }

    handleExpandDescriptionCheckBox(event) {
        const target = event.target;
        const value = target.type === 'checkbox' ? target.checked : target.value;
        this.setState({
            expandDescription: value
        })
        this.props.expandDescription(value)
    }

    render() {
        const {handleSubmit, startDate, devStartDate, devEndDate, endDate, releaseID, pristine, submitting, status, developer,developers} = this.props
        let releaseStartMoment = moment(momentTZ.utc(devStartDate).format(DATE_FORMAT))
        let releaseEndMoment = moment(momentTZ.utc(devEndDate).format(DATE_FORMAT))
        let filterStartMoment = startDate ? moment(startDate) : undefined
        let filterEndMoment = endDate ? moment(endDate) : undefined

        let maxStartMoment = filterEndMoment && filterEndMoment.isValid() ? filterEndMoment : releaseEndMoment
        let minEndMoment = filterStartMoment && filterStartMoment.isValid() ? filterStartMoment : releaseStartMoment
        console.log("Check the developers",developer)
        return <form onSubmit={handleSubmit}>
            <div className="col-md-12 planFilterTaskForm">
                <div className="col-md-6">
                    <div className="col-md-6">
                        <Field name="startDate"
                               placeholder={"From Date (Reported On)"}
                               component={renderDateTimePickerString}
                               onChange={(event, newValue, oldValue) => {
                                   console.log("onChange() ", releaseID, startDate)
                                   this.props.fetchTaskReports({
                                       releaseID,
                                       startDate: newValue,
                                       endDate,
                                       status,
                                       developer
                                   })

                               }}
                               showTime={false}
                               min={releaseStartMoment.toDate()}
                               max={maxStartMoment.toDate()}
                               label={" Start Date :"}/>
                    </div>
                    <div className="col-md-6">
                        <Field name="endDate" placeholder={"To Date (Reported On):"} component={renderDateTimePickerString}
                               onChange={(event, newValue, oldValue) => {
                                   this.props.fetchTaskReports({
                                       releaseID,
                                       startDate,
                                       endDate: newValue,
                                       status,
                                       developer
                                   })
                               }}
                               showTime={false}
                               min={minEndMoment.toDate()}
                               max={releaseEndMoment.toDate()}
                               label={" End Date :"}/>
                    </div>

                </div>

                <div className="col-md-2">

                    <Field name="status" component={renderSelect} label={"Status"} options={
                        SC.ALL_REPORTED_STATUS.map((status, idx) =>
                            ({
                                _id: status,
                                name: status
                            })
                        )
                    } onChange={(event, newValue) => {
                        this.props.fetchTaskReports({
                            releaseID,
                            startDate,
                            endDate,
                            status: newValue,
                            developer
                        })
                    }} noneOptionText='All'/>
                </div>
                <div className="col-md-2">
                    <Field name="developer" component={renderSelect} label={"Developer Name"} options={ developers} onChange={(event, newValue, oldValue) => {

                        console.log("get the new value of developer",newValue)
                        this.props.fetchTaskReports({
                            releaseID,
                            startDate,
                            endDate,
                            status,
                            developer: newValue
                        })
                    }} noneOptionText='All'/>
                </div>
                <div className={"col-md-2 top-label-checkbox"}>
                    <label>
                        Expand Requirement
                    </label>
                    <Field name={"expandDescription"} component="input" onChange={this.handleExpandDescriptionCheckBox}
                           type="checkbox"
                           onChange={(event, newValue) => {
                               this.props.expandReportDescription(newValue)
                           }
                           }
                    />
                </div>
            </div>
        </form>
    }
}

TaskReportDateNavBar = reduxForm({
    form: 'task-report-filter'
})(TaskReportDateNavBar)

const
    selector = formValueSelector('task-report-filter')

TaskReportDateNavBar = connect(
    state => {
        const {releaseId, startDate, endDate, status, developer} = selector(state, 'releaseId', 'startDate', 'endDate', 'status', 'developer')
        console.log("TaskPlanDateNaveBar->connect ", startDate)
        return {
            releaseId,
            startDate,
            endDate,
            status,
            developer
        }
    }
)(TaskReportDateNavBar)


export default TaskReportDateNavBar