import {connect} from 'react-redux'
import {TechnologyForm} from "../../components"
import * as A from '../../actions'
import * as COC from '../../components/componentConsts'
import {NotificationManager} from 'react-notifications'
import * as EC from "../../../server/errorcodes";
import {SubmissionError} from "redux-form";
import * as logger from '../../clientLogger'

const mapDispatchToProps = (dispatch, ownProps) => ({
    onSubmit: (values) => {
        logger.debug(logger.TECHNOLOGY_FORM_CONNECT, "onSubmit:values:", values)
        return dispatch(A.addTechnologyOnServer(values)).then(json => {
            if (json.success) {
                NotificationManager.success('Technology Added Successfully')
                dispatch(A.hideComponent(COC.TECHNOLOGY_FORM_DIALOG))

            } else {
                NotificationManager.error('Technology Not Added!')
                if (json.code == EC.ALREADY_EXISTS)
                    throw new SubmissionError({name: "Technology Already Exists"})
            }
            return json
        })

    }
})
const mapStateToProps = (state, ownProps) => ({
    //clients: state.client.all,
    technologies: state.technology.all,

})

const TechnologyFormContainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(TechnologyForm)

export default TechnologyFormContainer