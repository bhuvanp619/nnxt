import {Modal, ModalHeader, ModalTitle, ModalBody} from 'react-bootstrap'
import React from 'react'
import {EstimationInitiateFormContainer} from "../../containers"

const EstimationInitiateDialog = (props) => {
    return <Modal className="estimationModal" show={props.show} onHide={props.close}>
        <ModalHeader closeButton>
            <div className="clearfix ModalHeading">
                <div className="col-md-1 ModalSideLabel"></div>
                <h3>Initiate Estimation</h3>
            </div>
        </ModalHeader>
        <ModalBody>
            <EstimationInitiateFormContainer/>
        </ModalBody>
    </Modal>
}

export default EstimationInitiateDialog