import React, {Component} from 'react'
import {Field, formValueSelector, reduxForm} from 'redux-form'
import {renderTextArea, renderText, renderSelect} from './fields'
import {email, passwordLength, required} from "./validation"
import {connect} from 'react-redux'
import * as logger from '../../clientLogger'
import {EmailTypeFormContainer} from '../../containers'


class EmailTemplateForm extends Component {
    constructor(props) {
        super(props);
    }

    checkTemplateName(templateName){
        this.props.verifyTemplateName(templateName)
    }

    render() {
        console.log("allEmailTemplatesTypes", this.props.allEmailTemplatesTypes)
        return [
            <div key="UserFormBackButton" className="col-md-12">
                <button className="glyphicon glyphicon-arrow-left customBtn pull-left btn" type="button" style={{margin:'10px 0px'}}
                        onClick={() => this.props.showEmailTemplateList()}>
                </button>
            </div>,
            <div className="col-md-5">
            <form key="EmailTemplateForm" onSubmit={this.props.handleSubmit}>
                <div className="clearfix">
                    <div className="col-md-12 pad">
                        <Field name="_id" component="input" className="form-control" type="hidden"></Field>
                        <Field name="templateName" label="Name:" component={renderText} type="text"
                               validate={[required]} onkeyup={this.checkTemplateName(this.props.templateName)}/>
                        {this.props.isEmailTemplateNameExist ?
                            <h5 className="validation-error">Template name already exist!</h5>:null
                        }
                        <Field name="templateType" label="Type:" options={this.props.allEmailTemplatesTypes}
                               validate={[required]} component={renderSelect}/>
                        <Field name="templateSubject" label="Subject:" component={renderText} type="text"
                               validate={[required]}/>

                        <Field name="templateBody" label="Body:" component={renderTextArea}
                               validate={[required]} rows={10}/>

                                <button type="submit" style={{margin:'10px 0px'}} className="btn customBtn"> Save
                                </button>
                    </div>
                </div>
            </form>
            </div>,
            <div className="col-md-5 col-md-offset-1">
            <EmailTypeFormContainer/>
            </div>
        ]

    }
}

EmailTemplateForm = reduxForm({
    form: 'emailTemplate'
})(EmailTemplateForm)

export default EmailTemplateForm
