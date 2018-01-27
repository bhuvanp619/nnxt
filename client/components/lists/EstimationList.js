import React, {Component} from 'react'
import {BootstrapTable, TableHeaderColumn} from 'react-bootstrap-table'
import {withRouter} from 'react-router-dom'

class EstimationList extends Component {

    constructor(props) {
        super(props);
        this.options = {
            onRowClick: this.onRowClick.bind(this)
        }
    }

    onRowClick(row) {
        this.props.history.push("/app-home/estimation-detail")
        this.props.estimationSelected(row)

    }

    formatProject(project) {
        if (project)
            return project.name
        return ''
    }

    formatClient(client) {
        if (client)
            return client.name
        return ''
    }

    viewButton(cell, row, enumObject, rowIndex) {
        return (<button className="glyphicon glyphicon-th-list pull-left btn btn-custom" type="button">
            </button>
        )
    }

    render() {
        return (
            <div key="estimation_list" className="row">
                <div className="col-md-10">

                    <button className="btn btn-default btn-submit addBtn"
                            onClick={() => this.props.showEstimationInitiateForm()}>Initiate Estimation
                    </button>

                    <BootstrapTable options={this.options} data={this.props.estimations}
                                    striped={true}
                                    hover={true}>
                        <TableHeaderColumn isKey dataField='_id' hidden={true}>ID</TableHeaderColumn>
                        <TableHeaderColumn dataField='project'
                                           dataFormat={this.formatProject.bind(this)}>Project</TableHeaderColumn>
                        <TableHeaderColumn dataField='client'
                                           dataFormat={this.formatClient.bind(this)}>Client</TableHeaderColumn>
                        <TableHeaderColumn width="20%" dataField='button'
                                           dataFormat={this.viewButton.bind(this)}></TableHeaderColumn>

                    </BootstrapTable>
                </div>
            </div>
        )
    }
}

export default withRouter(EstimationList)