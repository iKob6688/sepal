const log = require('@sepal/log')
const job = require('@sepal/job')
const eeAuth = require('@sepal/ee/auth')

const worker$ = value => {
    const {getMap$} = require('@sepal/ee/utils')
    const {toGeometry} = require('@sepal/ee/aoi')
    const {allScenes, selectedScenes} = require('@sepal/ee/optical/collection')
    const {toMosaic} = require('@sepal/ee/optical/mosaic')

    log.debug('EE Image preview:', {value})


    const model = value.recipe.model
    const region = toGeometry(model.aoi)
    const dataSets = extractDataSets(model.sources)
    const surfaceReflectance = model.compositeOptions.corrections.includes('SR')
    const reflectance = surfaceReflectance ? 'SR' : 'TOA'
    const dates = model.dates
    const useAllScenes = model.sceneSelectionOptions.type === 'ALL'
    const collection = useAllScenes
        ? allScenes({region, dataSets, reflectance, dates})
        : selectedScenes({region, reflectance, scenes: model.scenes})
    const image = toMosaic({region, collection})
    const visParams = {bands: ['red', 'green', 'blue'], min: 0, max: 3000, gamma: 1.5}

    return getMap$(image, visParams)
}

module.exports = job({
    jobName: 'EE Image preview',
    jobPath: __filename,
    before: [eeAuth],
    worker$
})

const extractDataSets = (sources) =>
    Object.values(sources)
        .flat()
        .map(dataSet =>
            dataSet === 'LANDSAT_TM'
                ? ['LANDSAT_4', 'LANDSAT_5']
                : dataSet === 'LANDSAT_TM_T2'
                ? ['LANDSAT_4_T2', 'LANDSAT_5_T2']
                : dataSet
        )
        .flat()