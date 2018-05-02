import React, {Component} from 'react'
import {BootstrapTable, TableHeaderColumn} from 'react-bootstrap-table'
import {withRouter} from 'react-router-dom'
import * as SC from '../../../server/serverconstants'
import moment from 'moment'
import {ReleaseTaskSearchFormContainer} from '../../containers'

class ReleaseProjectTaskList extends Component {

    constructor(props) {
        super(props);
        this.options = {
            onRowClick: this.onRowClick.bind(this)
        }
        this.state = {
            status: "all",
            flag: "all"
        }
        this.onFlagChange = this.onFlagChange.bind(this)
        this.onStatusChange = this.onStatusChange.bind(this)

    }

    onFlagChange(flag) {
        this.setState({flag: flag})
        this.props.changeReleaseFlag(this.props.selectedProject, this.state.status, flag)
    }

    onStatusChange(status) {
        this.setState({status: status})
        this.props.changeReleaseStatus(this.props.selectedProject, status, this.state.flag)
    }

    onRowClick(row) {
        this.props.history.push("/app-home/release-task-planning")
        this.props.taskPlanSelected(row)
    }

    formatDate(row) {
        if (row) {
            return moment(row).format("DD-MM-YYYY")
        }
        return ''
    }

    formatEstimatedHours(task) {
        if (task)
            return task.estimatedHours
        return 0
    }

    formatReportedHours(report) {
        if (report)
            return report.reportedHours
        return 0
    }

    formatReportedStatus(report) {
        if (report)
            return report.finalStatus
        return 'unplanned'
    }


    formateTaskName(task) {
        if (task)
            return task.name
        return ''
    }

    formatTaskPlanStartDate(planning) {
        if (planning && planning.minPlanningDate) {
            return moment(planning.minPlanningDate).format("DD-MM-YYYY")
        }
        return ''
    }

    formatTaskPlanEndDate(planning) {
        if (planning && planning.maxPlanningDate) {
            return moment(planning.maxPlanningDate).format("DD-MM-YYYY")
        }
        return ''
    }

    render() {
        let team = 0
        const {selectedProject, projectTasks} = this.props
        return (
            <div key="estimation_list" className="clearfix">

                <div className="col-md-12 releaseHeader">
                    <div className=" col-md-1 backarrow" title="Go Back">
                        <button className="btn-link" onClick={() => {
                            this.props.history.push("/app-home/release")
                            this.props.ReleaseProjectGoBack()
                        }}><i className="glyphicon glyphicon-arrow-left"></i></button>
                    </div>
                    <div className="col-md-3">
                        <div className="releaseTitle">
                            <span
                                title={selectedProject.project ? selectedProject.project.name : ''}>Project Name</span>
                        </div>
                        <div className="releasecontent">
                            <p>{selectedProject.project ? selectedProject.project.name : ''}</p>
                        </div>
                    </div>
                    {/* <div className="col-md-3">
                            <div className="releaseTitle">
                                <span>Project Description</span></div>
                            <div className="releasecontent">
                                <p>Accusation Nation....(Read More)</p>
                            </div>
                        </div>*/}
                    <div className="col-md-2">
                        <div className="releaseTitle">
                            <span
                                title={selectedProject.initial ? moment(selectedProject.initial.devStartDate).format("DD-MM-YYYY") : ''}>Start Date</span>
                        </div>
                        <div className="releasecontent">
                            <p>{selectedProject.initial ? moment(selectedProject.initial.devStartDate).format("DD-MM-YYYY") : ''}</p>
                        </div>
                    </div>
                    <div className="col-md-2">
                        <div className="releaseTitle">
                            <span
                                title={selectedProject.initial ? moment(selectedProject.initial.devEndDate).format("DD-MM-YYYY") : ''}>End Date</span>
                        </div>
                        <div className="releasecontent">
                            <p>{selectedProject.initial ? moment(selectedProject.initial.devEndDate).format("DD-MM-YYYY") : ''}</p>
                        </div>
                    </div>
                    <div className="col-md-2">
                        <div className="releaseTitle">
                            <span
                                title={selectedProject.initial ? moment(selectedProject.initial.clientReleaseDate).format("DD-MM-YYYY") : ''}>Release Date</span>
                        </div>
                        <div className="releasecontent">
                            <p>{selectedProject.initial ? moment(selectedProject.initial.clientReleaseDate).format("DD-MM-YYYY") : ''}</p>
                        </div>
                    </div>
                    <div className=" col-md-2 releasefileoption">
                        <ul className="list-unstyled">
                            <li><a href="#"> <i className="fa fa-file-pdf-o"></i></a></li>
                            <li><a href="#"> <i className="fa fa-file-word-o"></i></a></li>
                            <li><a href="#"> <i className=" fa fa-file-excel-o"></i></a></li>
                        </ul>
                    </div>

                </div>
                <div className="col-md-12">
                    <div className="col-md-12">
                        <div className="col-md-2 pad ">
                            <div className="releaseTeamManager"><span>Manager</span>
                            </div>
                            <div className="estimationuser tooltip"><span>M</span>
                                <p className="tooltiptext">{selectedProject.manager ? selectedProject.manager.firstName : ''}</p>
                            </div>
                        </div>
                        <div className="col-md-2 pad ">
                            <div className="releaseTeamLeader"><span> Leader</span>
                            </div>
                            <div className="estimationuser tooltip"><span>L</span>
                                <p className="tooltiptext">{selectedProject.leader ? selectedProject.leader.firstName : ''}</p>
                            </div>
                        </div>
                        <div className="col-md-8 pad ">
                            <div className="releaseTeam"><span>Team</span>
                            </div>
                            {
                                selectedProject.team.map((teamMember, index) => {
                                    return <div key={"teamMember" + index} className="estimationuser tooltip">
                                        <span>T{index + 1}</span>
                                        <p className="tooltiptext">{teamMember ? teamMember.name : ''}</p>
                                    </div>
                                })
                            }

                        </div>

                    </div>
                    <div className="col-md-8 releaseOption releaseDetailSearchContent">

                        <div className="col-md-6 ">
                            <div className="releaseDetailSearchFlag">
                                <select className="form-control" title="Select Flag" onChange={(flag) =>
                                    this.onFlagChange(flag.target.value)
                                }>
                                    <option value="all">All Flags</option>
                                    <option value={SC.FLAG_UNPLANNED}>{SC.FLAG_UNPLANNED}</option>
                                    <option value={SC.FLAG_EMPLOYEE_ON_LEAVE}>{SC.FLAG_EMPLOYEE_ON_LEAVE}</option>
                                    <option value={SC.FLAG_DEV_DATE_MISSED}>{SC.FLAG_DEV_DATE_MISSED}</option>
                                    <option value={SC.FLAG_HAS_UNREPORTED_DAYS}>{SC.FLAG_HAS_UNREPORTED_DAYS}</option>
                                    <option
                                        value={SC.FLAG_PENDING_AFTER_END_DATE}>{SC.FLAG_PENDING_AFTER_END_DATE}</option>
                                    <option
                                        value={SC.FLAG_COMPLETED_BEFORE_END_DATE}>{SC.FLAG_COMPLETED_BEFORE_END_DATE}</option>

                                </select>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="releaseDetailSearchStatus">
                                <select className="form-control" title="Select Status"
                                        onChange={(status) => this.onStatusChange(status.target.value)}>
                                    <option value="all">All Status</option>
                                    <option value={SC.STATUS_UNPLANNED}>{SC.STATUS_UNPLANNED}</option>
                                    <option value={SC.STATUS_PENDING}>{SC.STATUS_PENDING}</option>
                                    <option value={SC.STATUS_DEV_IN_PROGRESS}>{SC.STATUS_DEV_IN_PROGRESS}</option>
                                    <option value={SC.STATUS_DEV_COMPLETED}>{SC.STATUS_DEV_COMPLETED}</option>
                                    <option value={SC.STATUS_RELEASED}>{SC.STATUS_RELEASED}</option>
                                    <option value={SC.STATUS_ISSUE_FIXING}>{SC.STATUS_ISSUE_FIXING}</option>
                                    <option value={SC.STATUS_OVER}>{SC.STATUS_OVER}</option>

                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="estimation">
                        <BootstrapTable options={this.options} data={projectTasks}
                                        multiColumnSearch={true}
                                        search={true}
                                        striped={true}
                                        hover={true}>
                            <TableHeaderColumn columnTitle isKey dataField='_id' hidden={true}>ID</TableHeaderColumn>
                            <TableHeaderColumn columnTitle dataField='created' dataFormat={this.formatDate.bind(this)}>Created</TableHeaderColumn>
                            <TableHeaderColumn columnTitle dataField='task'
                                               dataFormat={this.formateTaskName.bind(this)}>Task
                                Name</TableHeaderColumn>
                            <TableHeaderColumn columnTitle dataField='employee'>Emp./Team Name</TableHeaderColumn>
                            <TableHeaderColumn columnTitle dataField='flags'>Emp./Team Flag</TableHeaderColumn>
                            <TableHeaderColumn columnTitle dataField='task'
                                               dataFormat={this.formatEstimatedHours.bind(this)}>Est
                                Hours</TableHeaderColumn>
                            <TableHeaderColumn columnTitle dataField='report'
                                               dataFormat={this.formatReportedHours.bind(this)}>Reported
                                Hours</TableHeaderColumn>
                            <TableHeaderColumn columnTitle dataField='planning'
                                               dataFormat={this.formatTaskPlanStartDate.bind(this)}>Start Date
                            </TableHeaderColumn>
                            <TableHeaderColumn columnTitle dataField='planning'
                                               dataFormat={this.formatTaskPlanEndDate.bind(this)}>End Date
                            </TableHeaderColumn>

                            <TableHeaderColumn columnTitle dataField='report'
                                               dataFormat={this.formatReportedStatus.bind(this)}>Status</TableHeaderColumn>

                        </BootstrapTable>
                    </div>
                </div>
            </div>
        )
    }
}

export default withRouter(ReleaseProjectTaskList)