import {Field, formValueSelector, reduxForm} from 'redux-form'
import React from 'react'
import {required} from './validation'
import {renderText, renderTextArea} from './fields'
import * as logger from '../../clientLogger'
import {connect} from "react-redux";
import * as SC from '../../../server/serverconstants'

let EstimationSuggestFeatureForm = (props) => {
    logger.debug(logger.ESTIMATION_TASK_FORM_RENDER, props)
    const {pristine, submitting, reset, change} = props
    const {estimation, readOnly} = props
    return <form onSubmit={props.handleSubmit}>
        <div className="col-md-12">
            <div className="col-md-5">
                <div className="col-md-1">
                    {estimation.loggedInUserRole == SC.ROLE_NEGOTIATOR ?
                        <img key="estimator" className="suggestionUser div-hover" src="/images/estimator.png"
                             title="Estimator End"/> :
                        estimation.loggedInUserRole == SC.ROLE_ESTIMATOR ?
                            <img key="negotiator" className="suggestionUser div-hover" src="/images/negotiator.png"
                                 title="Negotiator End"/> : null
                    }
                </div>
                <div className="col-md-11">
                    {estimation.loggedInUserRole == SC.ROLE_NEGOTIATOR ?
                        <h4 className="estimatorClr">Estimator</h4> :
                        estimation.loggedInUserRole == SC.ROLE_ESTIMATOR ?
                            <h4 className="negotiatorClr">Negotiator</h4> : null
                    }

                    <div className="row">

                        <Field name="estimation._id" component="input" type="hidden"/>
                        <Field name="_id" component="input" type="hidden"/>

                        <div className="col-md-6">
                            <Field name="readOnly.name"
                                   readOnly={true}
                                   component={renderText}
                                   label={"Feature Name:"}
                            />
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-md-12">
                            <Field name="readOnly.description"
                                   readOnly={true}
                                   component={renderTextArea}
                                   rows="10"
                                   label="Feature Description:"
                            />
                        </div>

                    </div>

                </div>


            </div>
            <div className="col-md-2 ">
                <button type="button" className="suggestCopy btn-link"
                        title="Copy Feature Details"
                        onClick={() => {
                            change("name", readOnly.name)
                            change("description", readOnly.description)
                        }}><i className="glyphicon glyphicon-arrow-right"></i></button>
            </div>
            <div className="col-md-5">
                <div className="col-md-1">
                    {estimation.loggedInUserRole == SC.ROLE_ESTIMATOR ?
                        <img key="estimator" className="suggestionUser div-hover" src="/images/estimator.png"
                             title="Estimator End"/> :
                        estimation.loggedInUserRole == SC.ROLE_NEGOTIATOR ?
                            <img key="negotiator" className="suggestionUser div-hover" src="/images/negotiator.png"
                                 title="Negotiator End"/> : null
                    }
                </div>
                <div className="col-md-11">
                    {estimation.loggedInUserRole == SC.ROLE_ESTIMATOR ?
                        <h4 className="estimatorClr">{estimation.loggedInUserRole}</h4> :
                        estimation.loggedInUserRole == SC.ROLE_NEGOTIATOR ?
                            <h4 className="negotiatorClr">{estimation.loggedInUserRole}</h4> : null
                    }
                    <div className="row">

                        <div className="col-md-6">
                            <Field
                                name="name"
                                component={renderText}
                                label={"Feature Name:"}
                                validate={required}
                            />
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-md-12">
                            <Field
                                name="description"
                                component={renderTextArea}
                                label="Feature Description:"
                                rows="10"
                                validate={required}
                            />
                        </div>

                    </div>
                </div>


            </div>
            <div className="row initiatEstimation">
                <div className="col-md-6 text-center">
                    <button type="submit" disabled={pristine || submitting} className="btn customBtn">Save</button>
                </div>
                <div className="col-md-6 text-center">
                    <button type="button" disabled={pristine || submitting} className="btn customBtn" onClick={reset}>
                        Reset
                    </button>
                </div>
            </div>
        </div>
    </form>
}

EstimationSuggestFeatureForm = reduxForm({
    form: 'estimation-suggest-feature'
})(EstimationSuggestFeatureForm)

const selector = formValueSelector('estimation-suggest-feature')

EstimationSuggestFeatureForm = connect(
    state => {
        const loggedInUserRole = selector(state, 'loggedInUserRole')
        const readOnly = {
            name: selector(state, 'readOnly.name'),
            description: selector(state, 'readOnly.description')
        }
        return {
            loggedInUserRole,
            readOnly
        }
    }
)(EstimationSuggestFeatureForm)


export default EstimationSuggestFeatureForm