'use strict';
const {describe, it, beforeEach} = require('mocha');
const {expect} = require('chai');
const makeHandlers = require('../../../src/plugin/handlers');
const {PollingStatus} = require('../../../src/plugin/pollingHandler');
const {promisify: p} = require('util');
const psetTimeout = p(setTimeout);
const {TIMEOUT_MSG} = makeHandlers;

describe('handlers', () => {
  let handlers;

  const fakeOpenEyes = (args = {}) => ({
    checkWindow: async (args2 = {}) => {
      return Object.assign(args2, {__test: `checkWindow_${args.__test}`});
    },

    close: async () => {
      return {__test: `close_${args.__test}`};
    },

    abort: async () => {},
  });

  const openEyesWithCloseRejection = () => ({
    checkWindow: async x => x,
    close: async () => Promise.reject('bla'),
  });

  async function openAndClose() {
    await handlers.open();
    await handlers.close().catch(x => x);
  }

  beforeEach(() => {
    handlers = makeHandlers({
      makeVisualGridClient: () => ({
        openEyes: fakeOpenEyes,
      }),
    });
  });

  it('handles "open"', async () => {
    handlers.batchStart();
    const {checkWindow} = await handlers.open({__test: 123});
    expect((await checkWindow()).__test).to.equal('checkWindow_123');
  });

  it('throws when calling "checkWindow" before "open"', async () => {
    handlers.batchStart();
    expect(await handlers.checkWindow({}).then(x => x, err => err)).to.be.an.instanceof(Error);
    await openAndClose();
    expect(await handlers.checkWindow({}).then(x => x, err => err)).to.be.an.instanceof(Error);

    handlers = handlers = makeHandlers({
      makeVisualGridClient: () => ({
        openEyes: openEyesWithCloseRejection,
      }),
    });
    handlers.batchStart();
    expect(await handlers.checkWindow({}).then(x => x, err => err)).to.be.an.instanceof(Error);
    await openAndClose();
    expect(await handlers.checkWindow({}).then(x => x, err => err)).to.be.an.instanceof(Error);
  });

  it('throws when calling "close" before "open"', async () => {
    handlers.batchStart();
    expect(await handlers.close().then(x => x, err => err)).to.be.an.instanceof(Error);
    await openAndClose();
    expect(await handlers.close().then(x => x, err => err)).to.be.an.instanceof(Error);

    handlers = handlers = makeHandlers({
      makeVisualGridClient: () => ({
        openEyes: openEyesWithCloseRejection,
      }),
    });
    handlers.batchStart();
    expect(await handlers.close().then(x => x, err => err)).to.be.an.instanceof(Error);
    await openAndClose();
    expect(await handlers.close().then(x => x, err => err)).to.be.an.instanceof(Error);
  });

  it('handles "checkWindow"', async () => {
    handlers.batchStart();
    await handlers.open({__test: 123});

    const cdt = 'cdt';
    const resourceUrls = 'resourceUrls';
    const tag = 'tag';
    const sizeMode = 'sizeMode';
    const selector = 'selector';
    const region = 'region';
    const url = 'url';
    const scriptHooks = 'scriptHooks';
    const ignore = 'ignore';
    const floating = 'floating';
    const layout = 'layout';
    const strict = 'strict';
    const sendDom = 'sendDom';
    const resourceContents = {};

    const result = await handlers.checkWindow({
      cdt,
      resourceUrls,
      tag,
      url,
      sizeMode,
      selector,
      region,
      scriptHooks,
      ignore,
      floating,
      layout,
      strict,
      sendDom,
    });

    expect(result).to.eql({
      __test: 'checkWindow_123',
      resourceUrls,
      cdt,
      tag,
      sizeMode,
      url,
      selector,
      region,
      resourceContents,
      scriptHooks,
      ignore,
      floating,
      layout,
      strict,
      sendDom,
      frames: [],
    });
  });

  it('handles "putResource"', async () => {
    handlers.batchStart();
    await handlers.open({__test: 123});

    handlers.putResource('id1', 'buff1');
    handlers.putResource('id2', 'buff2');
    handlers.putResource('id3', 'buff3');

    const blobData = [
      {url: 'id1', type: 'type1'},
      {url: 'id2', type: 'type2'},
      {url: 'id3', type: 'type3'},
    ];

    const resourceContents = {
      id1: {url: 'id1', type: 'type1', value: 'buff1'},
      id2: {url: 'id2', type: 'type2', value: 'buff2'},
      id3: {url: 'id3', type: 'type3', value: 'buff3'},
    };

    const result = await handlers.checkWindow({blobData});
    expect(result.resourceContents).to.eql(resourceContents);
  });

  it('handles "checkWindow" with nested frames', async () => {
    handlers.batchStart();
    await handlers.open({__test: 123});

    const blobData = [{url: 'id1', type: 'type1'}];

    const frames = [
      {
        blobData: [{url: 'id2', type: 'type2'}],
        frames: [{blobData: [{url: 'id3', type: 'type3'}]}],
      },
    ];

    handlers.putResource('id1', 'buff1');
    handlers.putResource('id2', 'buff2');
    handlers.putResource('id3', 'buff3');

    const result = await handlers.checkWindow({
      blobData,
      frames,
    });

    expect(result).to.eql({
      __test: 'checkWindow_123',

      resourceContents: {
        id1: {url: 'id1', type: 'type1', value: 'buff1'},
      },
      frames: [
        {
          resourceContents: {
            id2: {url: 'id2', type: 'type2', value: 'buff2'},
          },
          frames: [
            {
              resourceContents: {
                id3: {url: 'id3', type: 'type3', value: 'buff3'},
              },
              resourceUrls: undefined,
              cdt: undefined,
              url: undefined,
              frames: undefined,
            },
          ],
          resourceUrls: undefined,
          cdt: undefined,
          url: undefined,
        },
      ],
      resourceUrls: undefined,
      cdt: undefined,
      url: undefined,
      tag: undefined,
      sizeMode: undefined,
      selector: undefined,
      region: undefined,
      scriptHooks: undefined,
      ignore: undefined,
      floating: undefined,
      layout: undefined,
      strict: undefined,
      sendDom: undefined,
    });
  });

  it('cleans resources on close', async () => {
    handlers.batchStart();
    await handlers.open({__test: 123});

    handlers.putResource('id', 'buff');
    const blobData = [{url: 'id', type: 'type'}];
    const expectedResourceContents = {
      id: {url: 'id', type: 'type', value: 'buff'},
    };
    const {resourceContents: actualResourceContents} = await handlers.checkWindow({blobData});

    expect(actualResourceContents).to.eql(expectedResourceContents);
    await handlers.close();

    const err = await handlers.checkWindow({blobData}).then(x => x, err => err);
    expect(err).to.be.an.instanceOf(Error);
    const err2 = await handlers.close().then(x => x, err => err);
    expect(err2).to.be.an.instanceOf(Error);
    await handlers.open({__test: 123});
    const {resourceContents: emptyResourceContents} = await handlers.checkWindow({blobData});
    expect(emptyResourceContents).to.eql({
      id: {url: 'id', type: 'type', value: undefined},
    });
  });

  it('handles "close"', async () => {
    handlers.batchStart();
    const {checkWindow, close} = await handlers.open({__test: 123});

    expect((await checkWindow()).__test).to.equal('checkWindow_123');
    expect((await close()).__test).to.equal('close_123');
  });

  it('handles "batchStart"', () => {
    let flag;
    handlers = makeHandlers({
      makeVisualGridClient: () => (flag = 'flag'),
    });
    handlers.batchStart();
    expect(flag).to.equal('flag');
  });

  it('handles "batchEnd"', async () => {
    let resolveClose;
    const openEyes = async () => ({
      checkWindow: () => {},

      close: async () =>
        new Promise(r => {
          resolveClose = args => r(args);
        }),

      abort: async () => {},
    });

    handlers = makeHandlers({
      makeVisualGridClient: () => ({openEyes}),
      processCloseAndAbort: async runningTests =>
        Promise.all(
          runningTests.map(async ({closePromise, abort}) =>
            closePromise ? (await closePromise)[1] : abort(),
          ),
        ),
      getErrorsAndDiffs: testResultsArr =>
        testResultsArr.reduce(
          ({passed, failed, diffs}, x) => {
            if (x === 'passed') passed.push(x);
            if (/^failed:/.test(x)) failed.push(x.split(':')[1]);
            if (x === 'diffs') diffs.push(x);
            return {passed, failed, diffs};
          },
          {
            passed: [],
            failed: [],
            diffs: [],
          },
        ),
      errorDigest: ({passed, failed, diffs}) => `${passed}::${failed}##${diffs}`,
    });

    handlers.batchStart();
    await openAndClose();

    // IDLE ==> WIP
    let result = await handlers.batchEnd();
    expect(result).to.eql({status: PollingStatus.IDLE});

    // WIP ==> WIP
    result = await handlers.batchEnd();
    expect(result).to.eql({status: PollingStatus.WIP});

    // WIP ==> DONE
    resolveClose(['passed']);
    await psetTimeout(0);

    // DONE ==> IDLE
    result = await handlers.batchEnd();
    expect(result).to.eql({status: PollingStatus.DONE, results: 1});

    // IDLE ==> WIP
    await openAndClose();
    result = await handlers.batchEnd();
    expect(result).to.eql({status: PollingStatus.IDLE});

    // WIP ==> ERROR (unexpected)
    resolveClose(['failed:bla']);
    await psetTimeout(0);

    // ERROR (unexpected) ==> IDLE
    result = await handlers.batchEnd().then(x => x, err => err);
    expect(result).to.be.an.instanceof(Error);
    expect(result.message).to.equal('passed::bla##');

    // IDLE ==> WIP (with timeout)
    await openAndClose();
    result = await handlers.batchEnd({timeout: 50});
    expect(result).to.eql({status: PollingStatus.IDLE});

    // WIP ==> TIMEOUT
    await psetTimeout(100);

    // TIMEOUT ==> IDLE
    result = await handlers.batchEnd().then(x => x, err => err);
    expect(result).to.be.an.instanceof(Error);
    expect(result.message).to.equal(TIMEOUT_MSG(50));

    // IDLE ==> DONE
    resolveClose([]);
    await psetTimeout(0);

    // DONE ==> IDLE
    result = await handlers.batchEnd().then(x => x, err => err);
    expect(result).to.be.an.instanceof(Error);
    expect(result.message).to.equal('passed::bla##');

    // IDLE ==> WIP
    await openAndClose();
    result = await handlers.batchEnd();
    expect(result).to.eql({status: PollingStatus.IDLE});

    // WIP ==> ERROR
    resolveClose(['passed', 'failed:bla', 'diffs']);
    await psetTimeout(0);

    // ERROR ==> IDLE
    result = await handlers.batchEnd().then(x => x, err => err);
    expect(result).to.be.an.instanceof(Error);
    expect(result.message).to.equal('passed,passed::bla,bla##diffs');
  });

  it('error in openEyes should cause close to do nothing', async () => {
    handlers = makeHandlers({
      makeVisualGridClient: () => ({
        openEyes: async () => {
          throw new Error('open');
        },
      }),
    });
    handlers.batchStart();
    await handlers.open().catch(x => x);
    const err = await handlers.close().then(x => x, err => err);
    expect(err).to.equal(undefined);
  });
});
