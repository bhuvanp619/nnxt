import {reduxForm, Field, Form} from 'redux-form'
import React from 'react'
import {required, email} from './validation'
import {renderText, renderTextArea, renderSelect, renderMultiselect} from './fields'
import * as logger from '../../clientLogger'

let EstimationInitiateForm = (props) => {
    logger.debug(logger.CLIENT_FORM_RENDER, props)
    return <form onSubmit={props.handleSubmit}>
        <div className="row">
            <div className="col-md-6">
                <Field name="project._id" component={renderSelect} label={"Project:"} options={props.projects}
                       validate={[required]}/>
            </div>
            <div className="col-md-6">
                <Field name="estimator._id" component={renderSelect} label={"Estimator:"} options={props.estimators}
                       displayField={"firstName"} validate={[required]}/>
            </div>
        </div>
        <div className="row">
            <div className="col-md-6">
                <Field name="technologies" component={renderMultiselect} label="technologies:"
                       data={props.technologies}/>
            </div>
        </div>

        <div className="row">
            <div className="col-md-12">
                <Field name="description" component={renderTextArea} label="Description:"/>
            </div>
        </div>
        <button type="submit" className="btn btn-submit">Submit</button>
    </form>
}

EstimationInitiateForm = reduxForm({
    form: 'estimation-initiate'
})(EstimationInitiateForm)

export default EstimationInitiateForm