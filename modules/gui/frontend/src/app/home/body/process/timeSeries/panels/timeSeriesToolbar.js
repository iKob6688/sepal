import {msg} from 'translate'
import {selectFrom} from 'stateUtils'
import {setInitialized} from 'app/home/body/process/recipe'
import {withRecipe} from 'app/home/body/process/recipeContext'
import Aoi from 'app/home/body/process/mosaic/panels/aoi/aoi'
import Dates from 'app/home/body/process/timeSeries/panels/dates/dates'
import PanelWizard from 'widget/panelWizard'
import PreProcessingOptions from 'app/home/body/process/timeSeries/panels/preProcessingOptions/preProcessingOptions'
import React from 'react'
import Retrieve from 'app/home/body/process/timeSeries/panels/retrieve/retrieve'
import Sources from 'app/home/body/process/timeSeries/panels/sources/sources'
import Toolbar, {ActivationButton} from 'widget/toolbar'
import styles from './timeSeriesToolbar.module.css'

const mapRecipeToProps = recipe => ({
    recipeId: recipe.id,
    initialized: selectFrom(recipe, 'ui.initialized')
})

class TimeSeriesToolbar extends React.Component {
    render() {
        const {recipeId, initialized} = this.props
        return (
            <PanelWizard
                panels={['aoi', 'dates', 'sources']}
                initialized={initialized}
                onDone={() => setInitialized(recipeId)}>

                <Retrieve/>
                <Aoi allowWholeFusionTable={true}/>
                <Dates/>
                <Sources/>
                <PreProcessingOptions/>

                <Toolbar
                    vertical
                    placement='top-right'
                    className={styles.top}>
                    <ActivationButton
                        id='retrieve'
                        icon='cloud-download-alt'
                        tooltip={msg('process.timeSeries.panel.retrieve.tooltip')}
                        disabled={!initialized}/>
                </Toolbar>
                <Toolbar
                    vertical
                    placement='bottom-right'
                    panel
                    className={styles.bottom}>
                    <ActivationButton
                        id='aoi'
                        label={msg('process.mosaic.panel.areaOfInterest.button')}
                        tooltip={msg('process.mosaic.panel.areaOfInterest.tooltip')}/>
                    <ActivationButton
                        id='dates'
                        label={msg('process.timeSeries.panel.dates.button')}
                        tooltip={msg('process.timeSeries.panel.dates.tooltip')}/>
                    <ActivationButton
                        id='sources'
                        label={msg('process.timeSeries.panel.sources.button')}
                        tooltip={msg('process.timeSeries.panel.sources.tooltip')}/>
                    <ActivationButton
                        id='preProcessingOptions'
                        label={msg('process.timeSeries.panel.preprocess.button')}
                        tooltip={msg('process.timeSeries.panel.preprocess.tooltip')}/>
                </Toolbar>
            </PanelWizard>
        )
    }
}

TimeSeriesToolbar.propTypes = {}

export default withRecipe(mapRecipeToProps)(TimeSeriesToolbar)