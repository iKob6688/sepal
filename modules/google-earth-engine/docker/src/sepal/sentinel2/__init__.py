from abc import abstractmethod

import ee
from datetime import datetime

from analyze import Analyze
from .. import MosaicSpec
from ..mosaic import DataSet


class Sentinel2MosaicSpec(MosaicSpec):
    def __init__(self, spec):
        super(Sentinel2MosaicSpec, self).__init__(spec)
        self.scale = min([
            resolution
            for band, resolution
            in _scale_by_band.iteritems()
            if band in self.bands
        ])
        self.brdf_correct = False

    def _data_sets(self):
        return [Sentinel2DataSet(self._create_image_filter())]

    @abstractmethod
    def _create_image_filter(self):
        """Creates an ee.Filter based on the spec.

        :return: A ee.Filter
        :rtype: ee.Filter
        """
        raise AssertionError('Method in subclass expected to have been invoked')


class Sentinel2AutomaticMosaicSpec(Sentinel2MosaicSpec):
    def __init__(self, spec):
        super(Sentinel2AutomaticMosaicSpec, self).__init__(spec)

    def _create_image_filter(self):
        """Creates a filter, removing all scenes outside of area of interest and outside of date range.

        :return: An ee.Filter.
        """
        image_filter = ee.Filter.And(
            ee.Filter.geometry(self.aoi.geometry()),
            ee.Filter.date(self.from_date, self.to_date)
        )
        return image_filter

    def __str__(self):
        return 'sentinel2.Sentinel2AutomaticMosaicSpec(' + str(self.spec) + ')'


class Sentinel2ManualMosaicSpec(Sentinel2MosaicSpec):
    def __init__(self, spec):
        super(Sentinel2ManualMosaicSpec, self).__init__(spec)
        self.scene_ids = spec['sceneIds']

        def acquisition(scene):
            date = datetime.strptime(scene[:8], '%Y%m%d')
            epoch = datetime.utcfromtimestamp(0)
            return (date - epoch).total_seconds() * 1000

        acquisition_timestamps = [acquisition(scene) for scene in self.scene_ids]
        self.from_date = min(acquisition_timestamps)
        self.to_date = max(acquisition_timestamps)

    def _create_image_filter(self):
        return ee.Filter.inList('system:index', ee.List(list(self.scene_ids)))

    def __str__(self):
        return 'sentinel.Sentinel2ManualMosaicSpec(' + str(self.spec) + ')'


_scale_by_band = {
    'blue': 10,
    'green': 10,
    'red': 10,
    'nir': 10,
    'swir1': 20,
    'swir2': 20,
    'dayOfYear': 10,
    'daysFromTarget': 10,
    'unixTimeDays': 10
}


class Sentinel2DataSet(DataSet):
    def __init__(self, image_filter):
        super(Sentinel2DataSet, self).__init__()
        self.image_filter = image_filter

    def to_collection(self):
        return ee.ImageCollection('COPERNICUS/S2').filter(self.image_filter)

    def analyze(self, image):
        return Analyze(image).apply()

    def masks_cloud_on_analysis(self):
        return False

    def bands(self):
        return {
            'aerosol': 'B1',
            'blue': 'B2',
            'green': 'B3',
            'red': 'B4',
            'nir': 'B8A',
            'swir1': 'B11',
            'swir2': 'B12',
            'cirrus': 'B10',
            'waterVapor': 'B9'
        }
