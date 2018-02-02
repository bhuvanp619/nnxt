import React from 'react'
import Multiselect from 'react-widgets/lib/Multiselect'
import DateTimePicker from 'react-widgets/lib/DateTimePicker'
/*
Form Field components
 */

export const renderText = ({
                               input,
                               label,
                               readOnly,
                                type,
                               placeholder,
                               meta: {touched, error, warning}
                           }) =>
    <div className="form-group">
        <label htmlFor={input.name}>{label} {touched &&
        ((error &&
            <span className="validation-error">
              {error}
            </span>))
        }</label>
        <input {...input} readOnly={readOnly} placeholder={placeholder} type={type}
               className={'form-control ' + (touched && ((!error && 'valid-field') || (error && 'invalid-field')))}/>
    </div>

export const renderCheckBox = ({
                                   input,
                                   label,
                                   readOnly,
                                   meta: {touched, error, warning}
                               }) =>
    <div className="input checkbox">
        {touched &&
        ((error &&
            <span className="validation-error">
              {error}
            </span>))
        }
        <label>
            <input {...input} readOnly={readOnly} type="checkbox"/>
            {label}
        </label>

    </div>


export const renderSelect = ({
                                 input,
                                 onChange,
                                 label,
                                 options,
                                 readOnly = false,
                                 noneOptionText = 'Select ...',
                                 showNoneOption = true,
                                 displayField = 'name',
                                 disabled = false,
                                 valueField = "_id",
                                 hoverEnabledMsg,
                                 hoverDisabledMsg,
                                 meta: {touched, error, warning}
                             }) => {

    return <div className="form-group" style={{position: "relative"}}>
        <label htmlFor={input.name}>{label} {touched &&
        ((error &&
            <span className="validation-error">
            {error}
          </span>))
        }</label>
        <select {...input}
                className={"form-control hoverTooltip " + (touched && ((!error && "valid-field") || (error && "invalid-field")))}
                disabled={disabled} readOnly={readOnly}>
            {showNoneOption && <option value="">{noneOptionText}</option>}
            {
                options && options.map(option =>
                    <option value={option[valueField]} key={option[valueField]}>{option[displayField]}</option>
                )
            }
        </select>
        {hoverEnabledMsg && <span className="enabledMsg">{hoverEnabledMsg}</span>}
        {hoverDisabledMsg && <span className="disabledMsg">{hoverDisabledMsg}</span>}
    </div>
}


export const renderTextArea = ({
                                   input,
                                   label,
                                   placeholder,
                                   disabled = false,
                                   rows,
                                   hoverEnabledMsg,
                                   hoverDisabledMsg,
                                   meta: {touched, error, warning}
                               }) =>
    <div className="form-group">
        <label htmlFor={input.name}>{label} {touched &&
        ((error &&
            <span className="validation-error">
            {error}
          </span>))
        }</label>
        <textarea rows={rows} {...input} placeholder={placeholder} disabled={disabled}
                  className={"form-control hoverToolTip " + (touched && ((!error && "valid-field") || (error && "invalid-field")))}></textarea>
    </div>
export const renderError = ({
                                input,
                                label,
                                meta: {touched, error, warning}
                            }) =>
    <h3><span className="label label-danger">{error}</span></h3>

export const renderLoginField = ({
                                     input,
                                     label,
                                     readOnly,
                                     type,
                                     placeholder,
                                     meta: {touched, error, warning}
                                 }) =>
    <div className="col-md-12">
        <label htmlFor={input.name}>{label} {touched &&
        ((error &&
            <span className="validation-error">
              {error}
            </span>))
        }</label>
        <input {...input} className="form-control" type={type}/>
    </div>

export const renderMultiselect = ({input, data, valueField, textField, label, placeholder, meta: {touched, error, warning}, disabled = false,}) =>
    <div className="form-group">
        <label htmlFor={input.name}>{label} {touched &&
        ((error &&
            <span className="validation-error">
                {error}
            </span>))
        }</label>
        <Multiselect {...input}
                     onBlur={() => input.onBlur()}
                     value={input.value || []} // requires value to be an array
                     data={data}
                     disabled={disabled}
                     valueField={valueField}
                     label={label}
                     textField={textField}
                     placeholder={placeholder}
        />
    </div>

export const renderField = ({
                                input,
                                label,
                                readOnly,
                                type,
                                placeholder,
                                meta: {touched, error, warning}
                            }) =>
    <div className="form-group">
        <label htmlFor={input.name}>{label} {touched &&
        ((error &&
            <span className="validation-error">
              {error}
            </span>))
        }</label>
        <input {...input} readOnly={readOnly} placeholder={placeholder} type={type}
               className={'form-control ' + (touched && ((!error && 'valid-field') || (error && 'invalid-field')))}/>
    </div>

export const renderDateTimePickerString = ({
                                               input: {onChange, value, name, onBlur},
                                               label,
                                               readOnly,
                                               timeZone = 'America/New_York',
                                               dropUp = false,
                                               info,
                                               showTime = false,
                                               showCalendar = true,
                                               min,
                                               max,
                                               type,
                                               placeholder,
                                               disabled = false,
                                               currentDate,
                                               meta: {touched, error, warning},
                                               hoverEnabledMsg,
                                               hoverDisabledMsg
                                           }) => {

    let val = undefined

    if (value) {
        if (showCalendar && showTime)
            val = moment(value, CONSTANTS.DATE_TIME_FORMAT).toDate()
        else if (showCalendar)
            val = moment(value, CONSTANTS.DATE_FORMAT).toDate()
        else if (showTime)
            val = moment(value, CONSTANTS.TIME_FORMAT).toDate()
    }

    const parse = event => {
        if (event) {
            //console.log("renderDateTimePickerString: event ", event)
            if (showCalendar) {
                if (showTime) {
                    if (typeof(event) === 'object' && event.target && event.target.value) {
                        //console.log("renderDateTimePickerString: event.target.value  ", event.target.value)
                        let v = moment(event.target.value).format(CONSTANTS.DATE_TIME_FORMAT)
                        return v
                    } else {
                        //console.log("renderDateTimePickerString: event  ", event)
                        let v = moment(event).format(CONSTANTS.DATE_TIME_FORMAT)
                        return v
                    }
                } else {
                    if (typeof(event) === 'object' && event.target && event.target.value) {
                        //console.log("renderDateTimePickerString: event.target.value  ", event.target.value)
                        let v = moment(event.target.value).format(CONSTANTS.DATE_FORMAT)
                        return v
                    } else {
                        //console.log("renderDateTimePickerString: event  ", event)
                        let v = moment(event).format(CONSTANTS.DATE_FORMAT)
                        return v
                    }
                }
            } else {
                if (showTime) {
                    if (typeof(event) === 'object' && event.target && event.target.value) {
                        if (event.target.value.length == 7)
                            event.target.value = '0' + event.target.value
                        return event.target.value;
                    } else {
                        if (event && event.length == 7)
                            event = '0' + event
                        let v = moment(event).format(CONSTANTS.TIME_FORMAT)
                        return v
                    }
                }
            }
        }
        return undefined
    }

    return <div className="form-group" style={{position: "relative"}}>
        <label htmlFor={name}>{label} {touched &&
        ((error &&
            <span className="validation-error">
            {error}
          </span>))

        }{(info &&
            <span className="field-info">
            {info}
          </span>)}</label>
        <DateTimePicker
            className=" hoverTooltip"
            min={min}
            max={max}
            readOnly={readOnly}
            disabled={disabled}
            onChange={event => onChange(parse(event))}
            onBlue={onBlur}
            time={showTime}
            calendar={showCalendar}
            value={val}
            dropUp={dropUp}
            currentDate={currentDate}
            onKeyPress={event => event.preventDefault()}
            onKeyDown={event => event.preventDefault()}
        />
        {hoverEnabledMsg && <span className="enabledMsg" style={{width: 250}}>{hoverEnabledMsg}</span>}
        {hoverDisabledMsg && <span className="disabledMsg">{hoverDisabledMsg}</span>}

    </div>
}
export const renderDateTimePicker = ({ input: { onChange, value }, showTime }) =>
    <DateTimePicker
        onChange={onChange}
        format="DD MMM YYYY"
        time={showTime}
        value={!value ? null : new Date(value)}
    />
