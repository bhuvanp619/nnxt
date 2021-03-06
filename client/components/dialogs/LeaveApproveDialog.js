import {Modal, ModalBody, ModalHeader} from 'react-bootstrap'
import React from 'react'
import {LeaveApprovalReasonFormContainer} from "../../containers"

const LeaveApproveDialog = (props) => {
    return <Modal className="estimationModal" show={props.show} onHide={props.close}>
        <ModalHeader closeButton>
            <div className="clearfix ModalHeading">
                <div className="col-md-1 ModalSideLabel"></div>
                <h3>Leave Approve</h3>
            </div>
        </ModalHeader>
        <ModalBody>
            <h4>Are you sure you want to <span>Approve </span>this leave. Please confirm!</h4>
            <LeaveApprovalReasonFormContainer isApproved={true}/>
        </ModalBody>
    </Modal>
}

export default LeaveApproveDialog