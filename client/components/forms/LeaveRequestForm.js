import {required} from "./validation"
import {renderDateTimePicker, renderDateTimePickerString, renderSelect, renderText, renderTextArea} from "./fields"
import {Field, reduxForm} from 'redux-form'
import React from 'react'
import moment from 'moment'
import * as logger from "../../clientLogger";

let LeaveRequestForm = (props) => {

    console.log("You are leave request Form", props)
    return <form onSubmit={props.handleSubmit}>
        <div className="row">
            <div className="col-md-6">
                <Field name="user.user.id" component="input" type="hidden"/>
                <Field name="user.user.id" component="input" type="hidden"/>
                <Field name="user.user.id" component="input" type="hidden"/>

                <Field name="leave.from" placeholder={"Leave From :"} component={renderText} showTime={false}
                       label={"From :"} validate={[required]}/>

                <Field name="leave.to" placeholder={"Leave To :"} component={renderText}
                       label={"To :"} validate={[required]}/>

                <Field name="leave.type" placeholder={"type of leave"} component={renderText} showTime={false}
                       label={"Type :"} validate={[required]}/>

                <Field width="80%" name="leave.description" validate={[required]} component={renderTextArea}
                       label="Description:"/>

                <button type="submit" className="btn customBtn"> Submit</button>
            </div>

        </div>

    </form>
}

LeaveRequestForm = reduxForm({
    form: 'leave-request'

})(LeaveRequestForm)

export default LeaveRequestForm