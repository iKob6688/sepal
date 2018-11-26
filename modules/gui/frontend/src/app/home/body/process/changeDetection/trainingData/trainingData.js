import {Field, Input, form} from 'widget/form'
import {Msg, msg} from 'translate'
import {Panel, PanelContent, PanelHeader} from 'widget/panel'
import {RecipeActions, RecipeState, recipePath} from '../changeDetectionRecipe'
import {Subject} from 'rxjs'
import {loadFusionTableColumns$} from 'app/home/map/fusionTable'
import {map, takeUntil} from 'rxjs/operators'
import ComboBox from 'widget/comboBox'
import PanelButtons from 'widget/panelButtons'
import PropTypes from 'prop-types'
import React from 'react'
import styles from './trainingData.module.css'

const fields = {
    fusionTable: new Field()
        .notBlank('process.changeDetection.panel.trainingData.form.fusionTable.required'),
    fusionTableColumn: new Field()
        .notBlank('process.changeDetection.panel.trainingData.form.fusionTableColumn.required')
}

const mapStateToProps = (state, ownProps) => {
    const recipeId = ownProps.recipeId
    const recipeState = RecipeState(recipeId)
    let values = recipeState('ui.trainingData')
    if (!values) {
        const model = recipeState('model.trainingData')
        values = modelToValues(model)
        RecipeActions(recipeId).setTrainingData({values, model}).dispatch()
    }
    return {
        values,
        columns: recipeState('ui.fusionTable.columns')
    }
}

class TrainingData extends React.Component {
    constructor(props) {
        super(props)
        this.fusionTableChanged$ = new Subject()
        this.recipeActions = RecipeActions(props.recipeId)
    }

    loadFusionTableColumns(fusionTableId) {
        const {asyncActionBuilder, inputs: {fusionTableColumn}} = this.props
        asyncActionBuilder('LOAD_FUSION_TABLE_COLUMNS',
            loadFusionTableColumns$(fusionTableId, {includedTypes: ['NUMBER']}).pipe(
                map(response => {
                    if (response.error)
                        this.props.inputs.fusionTable.setInvalid(
                            msg(response.error.key)
                        )
                    return (response.columns || [])
                        .filter(column => column.type !== 'LOCATION')
                }),
                map(columns => columns.map(({name}) => ({value: name, label: name}))),
                map(columns => {
                    const defaultColumn = columns.length === 1 ? columns[0] : columns.find(column => column.value === 'class')
                    if (defaultColumn)
                        fusionTableColumn.set(defaultColumn.value)
                    return this.recipeActions.setFusionTableColumns(columns)
                }),
                takeUntil(this.fusionTableChanged$))
        )
            .dispatch()
    }

    render() {
        const {recipeId, form} = this.props
        return (
            <Panel
                className={styles.panel}
                form={form}
                statePath={recipePath(recipeId, 'ui')}
                onApply={values => this.recipeActions.setTrainingData({
                    values,
                    model: valuesToModel(values)
                }).dispatch()}>
                <PanelHeader
                    icon='cog'
                    title={msg('process.changeDetection.panel.trainingData.title')}/>

                <PanelContent>
                    {this.renderContent()}
                </PanelContent>

                <PanelButtons/>
            </Panel>
        )
    }

    renderContent() {
        const {action, columns, inputs: {fusionTable, fusionTableColumn}} = this.props
        const columnState = action('LOAD_FUSION_TABLE_COLUMNS').dispatching
            ? 'loading'
            : columns && columns.length > 0
                ? 'loaded'
                : 'noFusionTable'
        return (
            <React.Fragment>
                <Input
                    label={msg('process.changeDetection.panel.trainingData.form.fusionTable.label')}
                    autoFocus
                    input={fusionTable}
                    placeholder={msg('process.changeDetection.panel.trainingData.form.fusionTable.placeholder')}
                    spellCheck={false}
                    onChange={e => {
                        fusionTableColumn.set('')
                        this.recipeActions.setFusionTableColumns(null).dispatch()
                        this.fusionTableChanged$.next()
                        const fusionTableMinLength = 30
                        if (e && e.target.value.length > fusionTableMinLength)
                            this.loadFusionTableColumns(e.target.value)
                    }}
                    errorMessage
                />
                <ComboBox
                    label={msg('process.changeDetection.panel.trainingData.form.fusionTableColumn.label')}
                    input={fusionTableColumn}
                    isLoading={action('LOAD_FUSION_TABLE_COLUMNS').dispatching}
                    disabled={!columns || columns.length === 0}
                    placeholder={msg(`process.changeDetection.panel.trainingData.form.fusionTableColumn.placeholder.${columnState}`)}
                    options={columns || []}
                    errorMessage
                />

                <p>
                    <a href='/ceo' target='_blank'><Msg id='process.changeDetection.panel.trainingData.form.openCeo'/></a>
                </p>
            </React.Fragment>
        )
    }
}

TrainingData.propTypes = {
    recipeId: PropTypes.string
}

const valuesToModel = values => ({
    ...values
})

const modelToValues = (model = {}) => ({
    ...model
})

export default form({fields, mapStateToProps})(TrainingData)
