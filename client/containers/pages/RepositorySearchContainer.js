import {connect} from 'react-redux'
import {RepositorySearch} from '../../components'
import * as EC from '../../../server/errorcodes'
import * as COC from '../../components/componentConsts'
import * as A from '../../actions'

const mapDispatchToProps = (dispatch, ownProps) => ({
    showFeatureDetailPage: (feature) => {
        dispatch(A.selectFeatureFromRepository(feature))
        dispatch(A.showComponent(COC.REPOSITORY_FEATURE_DETAIL_DIALOG))
    },
    showTaskDetailPage: (task) => {
        dispatch(A.selectTaskFromRepository(task))
        dispatch(A.showComponent(COC.REPOSITORY_TASK_DETAIL_DIALOG))
    }
})


const mapStateToProps = (state) => ({})

const RepositorySearchContainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(RepositorySearch)

export default RepositorySearchContainer