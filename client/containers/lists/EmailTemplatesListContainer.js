import {connect} from 'react-redux'
import {EmailTemplateList} from "../../components"
import * as A from "../../actions"
import * as COC from "../../components/componentConsts";
import {initialize, SubmissionError} from 'redux-form'
import {NotificationManager} from "react-notifications";

const mapDispatchToProps = (dispatch, ownProps) => ({
    editEmailTemplate: (template) => {
        dispatch(A.saveEditTemplateInfo(template))
            dispatch(A.showComponentHideOthers(COC.EMAIL_TEMPLATE_FORM)),
            dispatch(initialize('emailTemplate', template))
    },
    deleteEmailTemplate: (templateID) => dispatch(A.deleteEmailTemplateFromServer(templateID)).then(json => {
        if (json.success) {
            dispatch(A.getAllEmailTemplatesFromServer())
            NotificationManager.success('Email Template Deleted Successfully')
        } else {
            NotificationManager.error('Email Template Not Deleted!')
        }
    }),
    showEmailTemplateForm: () => {
        dispatch(A.showComponentHideOthers(COC.EMAIL_TEMPLATE_FORM))
        dispatch(A.getAllEmailTemplatesTypesFromServer())
    }
})

const mapStateToProps = (state, ownProps) => {
    return {
        loggedInUser: state.user.loggedIn,
        emailTemplates: state.emailTemplate.allEmailTemplates,
        editTemplateInfo: state.emailTemplate && state.emailTemplate.editTemplateInfo ? state.emailTemplate.editTemplateInfo : null
    }
}

const EmailTemplatesListContainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(EmailTemplateList)

export default EmailTemplatesListContainer