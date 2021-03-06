import {connect} from 'react-redux'
import {RepositorySearch} from '../../components'
import * as COC from '../../components/componentConsts'
import * as A from '../../actions'
import * as SC from '../../../server/serverconstants'

const mapDispatchToProps = (dispatch, ownProps) => ({
    showFeatureDetailPage: (feature) => {
        dispatch(A.selectFeatureFromRepository(feature))
        dispatch(A.showComponent(COC.REPOSITORY_FEATURE_DETAIL_DIALOG))
    },

    showTaskDetailPage: (task) => {
        dispatch(A.selectTaskFromRepository(task))
        dispatch(A.showComponent(COC.REPOSITORY_TASK_DETAIL_DIALOG))
    },
    getAllRepositoryData: (technologies) => dispatch(A.getRepositoryFromServer(technologies, SC.ALL)),
    fetchRepositoryBasedOnDiffCriteria: (tags, type, searchText) => {
        let technologies = [];
        tags.map((f, i) => {
            technologies.push(f.text)
        })
        dispatch(A.getRepositoryFromServer(technologies, type, searchText))
    },

})


const mapStateToProps = (state) => ({
    repository: state.repository.all,
    estimation: state.estimation.selected
})

const RepositorySearchContainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(RepositorySearch)

export default RepositorySearchContainer
