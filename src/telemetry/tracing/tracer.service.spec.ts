import { TraceService } from './trace.service';

const SPAN_ID = 'currentMockedSpanId';

const CURRENT_TRACER = {
  startSpan: jest.fn(),
};

jest.mock('@opentelemetry/api', () => ({
  context: {
    active: jest.fn(),
  },
  trace: {
    getTracer: () => CURRENT_TRACER,
    getSpan: () => SPAN_ID,
  },
}));

describe('TracerService', () => {
  let service: TraceService;

  beforeEach(() => {
    service = new TraceService();
  });

  it('Should properly call get current tracer', () => {
    const span = service.getTracer();
    expect(span).toEqual(CURRENT_TRACER);
  });

  it('Should properly call getSpan from OpenTelemetry API', () => {
    const span = service.getSpan();
    expect(span).toBe(SPAN_ID);
  });

  it('Should properly call startSpan from OpenTelemetry API', () => {
    const NEW_SPAN_NAME = 'testSpan';
    service.startSpan(NEW_SPAN_NAME);
    expect(CURRENT_TRACER.startSpan).toBeCalledWith(NEW_SPAN_NAME);
  });
});
