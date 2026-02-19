// Manual mock for ethers
function fn(returnValue?: any) {
  const mock: any = (...args: any[]) => {
    mock.calls.push(args);
    return mock._returnValue;
  };
  mock.calls = [] as any[];
  mock._returnValue = returnValue;
  mock.mockReturnValue = (v: any) => { mock._returnValue = v; return mock; };
  mock.mockResolvedValue = (v: any) => { mock._returnValue = Promise.resolve(v); return mock; };
  return mock;
}

export const ethers = {
  ZeroAddress: '0x0000000000000000000000000000000000000000',
  JsonRpcProvider: function() { return {}; },
  Wallet: function(_key: string, _provider?: any) {
    return {
      address: '0xMockBaseAddress',
      getAddress: () => Promise.resolve('0xMockBaseAddress'),
      sendTransaction: fn(Promise.resolve({ hash: '0xtx', wait: fn() })),
    };
  },
  Contract: function(_addr: string, _abi: any, _signer?: any) {
    const registerResult = Promise.resolve({ wait: fn(Promise.resolve({ hash: '0xreg', logs: [] })) });
    return {
      balanceOf: fn(Promise.resolve(BigInt(1000000))),
      decimals: fn(Promise.resolve(6)),
      'register(string)': fn(registerResult),
      'register()': fn(registerResult),
      transfer: fn(),
      tokenURI: fn(Promise.resolve('data:application/json;base64,e30=')),
      interface: {
        parseLog: () => null,
      },
    };
  },
  formatUnits: (_val: any, _dec: any) => '1.0',
  formatEther: (_val: any) => '0.1',
};
