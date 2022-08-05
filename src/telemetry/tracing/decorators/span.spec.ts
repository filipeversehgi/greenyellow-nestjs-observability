import { Span } from './span';

const generateSpanSpy = () => ({
  spanName: '',
  end: jest.fn(),
});

let spanSpy = generateSpanSpy();

jest.mock('@opentelemetry/api', () => ({
  trace: {
    getTracer: () => ({
      startActiveSpan: (name, callback) => {
        spanSpy.spanName = name;
        return callback(spanSpy);
      },
    }),
  },
}));

const SPAN_NAME = 'TestSpan';

class DecoratorTester {
  @Span(SPAN_NAME)
  executeSync() {
    return 5;
  }

  @Span()
  executeSyncWithoutName() {
    return 5;
  }

  @Span(SPAN_NAME)
  async executeAsync() {
    return 10;
  }
  @Span()
  async executeAsyncWithoutName() {
    return 10;
  }
}

describe('Span Decorator', () => {
  beforeEach(() => {
    spanSpy = generateSpanSpy();
  });

  it('Should decorate sync methods using a custom name', () => {
    const tester = new DecoratorTester();
    const result = tester.executeSync();
    expect(result).toBe(5);
    expect(spanSpy.end).toHaveBeenCalledTimes(1);
    expect(spanSpy.spanName).toBe(SPAN_NAME);
  });

  it('Should decorate sync methods forwarding method name', () => {
    const tester = new DecoratorTester();
    const result = tester.executeSyncWithoutName();
    expect(result).toBe(5);
    expect(spanSpy.end).toHaveBeenCalledTimes(1);
    expect(spanSpy.spanName).toBe('DecoratorTester.executeSyncWithoutName');
  });

  it('Should decorate async methods using a custom name', async () => {
    const tester = new DecoratorTester();
    const result = await tester.executeAsync();
    expect(result).toBe(10);
    expect(spanSpy.end).toHaveBeenCalledTimes(1);
    expect(spanSpy.spanName).toBe(SPAN_NAME);
  });

  it('Should decorate async methods forwarding method name', async () => {
    const tester = new DecoratorTester();
    const result = await tester.executeAsyncWithoutName();
    expect(result).toBe(10);
    expect(spanSpy.end).toHaveBeenCalledTimes(1);
    expect(spanSpy.spanName).toBe('DecoratorTester.executeAsyncWithoutName');
  });
});
