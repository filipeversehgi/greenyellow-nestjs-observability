import {
  getOrCreateCounter,
  getOrCreateHistogram,
  getOrCreateObservableCounter,
  getOrCreateObservableGauge,
  getOrCreateObservableUpDownCounter,
  getOrCreateUpDownCounter,
} from './metric-data';

const mockedGetMeterOutput: { [key: string]: jest.Mock } = {};

jest.mock('@opentelemetry/api-metrics', () => ({
  metrics: {
    getMeterProvider: () => ({
      getMeter: () => mockedGetMeterOutput,
    }),
  },
}));

const scenarios = [
  {
    name: 'getOrCreateHistogram',
    method: getOrCreateHistogram,
    otelMethodToMock: 'createHistogram',
  },
  {
    name: 'getOrCreateCounter',
    method: getOrCreateCounter,
    otelMethodToMock: 'createCounter',
  },
  {
    name: 'getOrCreateUpDownCounter',
    method: getOrCreateUpDownCounter,
    otelMethodToMock: 'createUpDownCounter',
  },
  {
    name: 'getOrCreateObservableGauge',
    method: getOrCreateObservableGauge,
    otelMethodToMock: 'createObservableGauge',
    callback: jest.fn(),
  },
  {
    name: 'getOrCreateObservableCounter',
    method: getOrCreateObservableCounter,
    otelMethodToMock: 'createObservableCounter',
    callback: jest.fn(),
  },
  {
    name: 'getOrCreateObservableUpDownCounter',
    method: getOrCreateObservableUpDownCounter,
    otelMethodToMock: 'createObservableUpDownCounter',
    callback: jest.fn(),
  },
];

describe('MetricService', () => {
  // All Tests, for the sake of praticity, test the Creation and the the Get.
  for (const scenario of scenarios) {
    describe(scenario.name, () => {
      jest.clearAllMocks();

      const MOCKED_METER = 'MOCKED_METER';
      const METRIC_NAME = scenario.name;
      const METRIC_OPTS = {};

      mockedGetMeterOutput[scenario.otelMethodToMock] = jest.fn().mockReturnValue(MOCKED_METER);

      it('Should create if metric does not exists', () => {
        const output = scenario.callback ? scenario.method(METRIC_NAME, METRIC_OPTS, scenario.callback) : scenario.method(METRIC_NAME, METRIC_OPTS);
        expect(mockedGetMeterOutput[scenario.otelMethodToMock]).toBeCalledTimes(1);

        if (scenario.callback) {
          expect(mockedGetMeterOutput[scenario.otelMethodToMock]).toBeCalledWith(METRIC_NAME, METRIC_OPTS, scenario.callback);
        } else {
          expect(mockedGetMeterOutput[scenario.otelMethodToMock]).toBeCalledWith(METRIC_NAME, METRIC_OPTS);
        }
        expect(output).toBe(MOCKED_METER);
      });

      it('Should get if metric already exists', () => {
        const secondOutput = scenario.method(METRIC_NAME, METRIC_OPTS);
        expect(secondOutput).toBe(MOCKED_METER);
        expect(mockedGetMeterOutput[scenario.otelMethodToMock]).toBeCalledTimes(1);
        expect(secondOutput).toBe(MOCKED_METER); // Only the first time
      });
    });
  }
});
