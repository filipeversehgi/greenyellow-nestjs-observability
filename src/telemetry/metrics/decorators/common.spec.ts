import { getOrCreateCounter } from '../metric-data';
import { OtelInstanceCounter, OtelMethodCounter } from './common';

const mockedAdd = jest.fn();

jest.mock('../metric-data', () => ({
  getOrCreateCounter: jest.fn().mockReturnValue({
    add: () => {
      mockedAdd();
    },
  }),
}));

const getOrCreateCounterMock = getOrCreateCounter as jest.Mock;

@OtelInstanceCounter()
class DecoratorTester {
  @OtelMethodCounter()
  executeSync() {
    return true;
  }
}

describe('Instance Counters', () => {
  let tester: DecoratorTester;

  it('Should create a instance counter in the first instancialization', () => {
    expect(getOrCreateCounterMock).toBeCalledTimes(0);
    tester = new DecoratorTester();
    expect(getOrCreateCounterMock).toBeCalledTimes(1);
    expect(getOrCreateCounterMock).toBeCalledWith('app_DecoratorTester_instances_total', {
      description: 'app_DecoratorTester object instances total',
    });
  });

  it('Should create a method counter in the first call', () => {
    tester.executeSync();
    expect(getOrCreateCounterMock).toBeCalledTimes(2);
    expect(getOrCreateCounterMock).toBeCalledWith('app_DecoratorTester_executeSync_calls_total', {
      description: 'app_DecoratorTester#executeSync called total',
    });
  });

  it('Should reuse instances and method counters if they already exists', () => {
    const secondTester = new DecoratorTester();
    secondTester.executeSync();
    expect(getOrCreateCounterMock).toBeCalledTimes(2);
    expect(mockedAdd).toBeCalledTimes(4);
  });
});
