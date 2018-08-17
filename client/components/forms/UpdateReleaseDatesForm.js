import React, {Component} from 'react'
import {Field,formValueSelector, reduxForm} from 'redux-form'
import {renderDateTimePickerString, renderDateTimeStringShow, renderField, renderSelect} from './fields'
import {required} from "./validation"
import moment from 'moment'
import momentLocalizer from 'react-widgets-moment'
import {connect} from 'react-redux'
import * as SC from "../../../server/serverconstants";

moment.locale('en')
momentLocalizer()
let UpdateReleaseDatesForm = (props) => {
    const {handleSubmit, submitting, pristine, reset, release, change} = props

    let iterations = release.iterations.filter(i => i.type === SC.ITERATION_TYPE_ESTIMATED)

    return <form onSubmit={handleSubmit}>

        <div className="col-md-8">

            <Field name="_id" component="input" type="hidden"/>

            <div className="col-md-10 col-md-offset-1">
                <Field name="iteration._id" component={renderSelect} label={"Iteration :"} options={iterations}
                       validate={[required]} onChange={(event, newValue, oldValue) => {
                           let iteration = release.iterations.find(i => i._id.toString() == newValue)
                           const devStartDate = moment(iteration.devStartDate).format(SC.DATE_FORMAT)
                           const devEndDate = moment(iteration.devEndDate).format(SC.DATE_FORMAT)
                           const clientReleaseDate = moment(iteration.clientReleaseDate).format(SC.DATE_FORMAT)
                           change("updatedDevStartDate", devStartDate)
                           change("updatedDevEndDate", devEndDate)
                           change("updatedClientReleaseDate", clientReleaseDate)
                }}/>
            </div>

            <div className="col-md-10 col-md-offset-1">
                <Field name="updatedDevStartDate"
                       placeholder={"Date"}
                       component={renderDateTimePickerString}
                       showTime={false}

                       label={"Re-Plan Start Date :"}
                       validate={[required]}
                />
            </div>

            <div className="col-md-10 col-md-offset-1">
                <Field name="updatedDevEndDate"
                       placeholder={"Date"}
                       component={renderDateTimePickerString}
                       showTime={false}

                       label={"Replanned End Date :"}
                       validate={[required]}
                />
            </div>

            <div className="col-md-10 col-md-offset-1">
                <Field name="updatedClientReleaseDate"
                       placeholder={"Date"}
                       component={renderDateTimePickerString}
                       showTime={false}
                       label={"Client Release Date :"}
                       validate={[required]}
                       dropUp={true}
                />
            </div>

        </div>

        <div className="col-md-12">
            <div className="col-md-4">
                <button type="submit" className="btn customBtn" disabled={submitting || pristine}>
                    Update Release
                </button>
            </div>
            <div className="col-md-4">
                <button type="button" className="btn customBtn" disabled={submitting || pristine} onClick={reset}>
                    Reset
                </button>
            </div>
        </div>


    </form>
}

UpdateReleaseDatesForm = reduxForm({
    form: 'update-release-dates'
})(UpdateReleaseDatesForm)

const selector = formValueSelector('update-release-dates')

UpdateReleaseDatesForm = connect(
    state => {
        const {rePlanStartDate, rePlanEndDate, rePlanningClientReleaseDate} = selector(state, 'rePlanStartDate', rePlanEndDate, 'rePlanningClientReleaseDate')
        return {
            rePlanStartDate,
            rePlanEndDate,
            rePlanningClientReleaseDate
        }
    }
)(UpdateReleaseDatesForm)

export default UpdateReleaseDatesForm