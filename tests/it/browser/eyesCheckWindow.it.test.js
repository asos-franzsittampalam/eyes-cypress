'use strict';

const {describe, it} = require('mocha');
const {expect} = require('chai');
const makeEyesCheckWindow = require('../../../src/browser/eyesCheckWindow');

describe('eyesCheckWindow', () => {
  it('handles string input', async () => {
    let sendRequestInput;
    const resourcesPutted = [];

    const blob1 = {url: 'blobUrl1', type: 'blobType1', value: {someKey: 'bla'}};
    const blob2 = {url: 'blobUrl2', type: 'blobType2', value: {someKey: 'blabla'}};
    const blobs = [blob1, blob2];
    const resourceUrls = 'resourceUrls';
    const url = 'url';
    const cdt = 'cdt';
    const frames = [];
    const eyesCheckWindow = makeEyesCheckWindow({sendRequest, processPage});

    const tag = 'some tag';

    await eyesCheckWindow('bla doc', tag);
    expect(sendRequestInput).to.eql({
      command: 'checkWindow',
      data: {
        url,
        cdt,
        resourceUrls,
        blobData: [{url: 'blobUrl1', type: 'blobType1'}, {url: 'blobUrl2', type: 'blobType2'}],
        frames,
        tag,
        ignore: undefined,
        floating: undefined,
        layout: undefined,
        strict: undefined,
        region: undefined,
        scriptHooks: undefined,
        selector: undefined,
        sendDom: undefined,
        sizeMode: undefined,
        debugCdt: undefined,
      },
    });
    expect(resourcesPutted).to.eql([
      {
        command: `resource/blobUrl1`,
        data: {someKey: 'bla'},
        headers: {
          'Content-Type': 'application/octet-stream',
        },
        method: 'PUT',
      },
      {
        command: `resource/blobUrl2`,
        data: {someKey: 'blabla'},
        headers: {
          'Content-Type': 'application/octet-stream',
        },
        method: 'PUT',
      },
    ]);

    function sendRequest(arg) {
      if (arg.command === 'checkWindow') sendRequestInput = arg;
      else {
        resourcesPutted.push(arg);
      }
    }

    async function processPage() {
      return {resourceUrls, blobs, frames, url, cdt};
    }
  });

  it('handles object input', async () => {
    let sendRequestInput;
    const resourcesPutted = [];

    const blob1 = {url: 'blobUrl1', type: 'blobType1', value: {someKey: 'bla'}};
    const blob2 = {url: 'blobUrl2', type: 'blobType2', value: {someKey: 'blabla'}};
    const blobs = [blob1, blob2];
    const resourceUrls = 'resourceUrls';
    const url = 'url';
    const cdt = 'cdt';
    const frames = [];
    const eyesCheckWindow = makeEyesCheckWindow({sendRequest, processPage});

    const tag = 'some tag';
    const sizeMode = 'sizeMode';
    const selector = 'selector';
    const region = 'region';
    const scriptHooks = 'scriptHooks';
    const ignore = 'ignore';
    const floating = 'floating';
    const layout = 'layout';
    const strict = 'strict';
    const sendDom = 'sendDom';

    await eyesCheckWindow('bla doc', {
      tag,
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

    expect(sendRequestInput).to.eql({
      command: 'checkWindow',
      data: {
        url,
        cdt,
        resourceUrls,
        blobData: [{url: 'blobUrl1', type: 'blobType1'}, {url: 'blobUrl2', type: 'blobType2'}],
        frames,
        tag,
        sizeMode,
        selector,
        region,
        scriptHooks,
        ignore,
        floating,
        layout,
        strict,
        sendDom,
        debugCdt: undefined,
      },
    });
    expect(resourcesPutted).to.eql([
      {
        command: `resource/blobUrl1`,
        data: {someKey: 'bla'},
        headers: {
          'Content-Type': 'application/octet-stream',
        },
        method: 'PUT',
      },
      {
        command: `resource/blobUrl2`,
        data: {someKey: 'blabla'},
        headers: {
          'Content-Type': 'application/octet-stream',
        },
        method: 'PUT',
      },
    ]);

    function sendRequest(arg) {
      if (arg.command === 'checkWindow') sendRequestInput = arg;
      else {
        resourcesPutted.push(arg);
      }
    }

    async function processPage() {
      return {resourceUrls, blobs, frames, url, cdt};
    }
  });

  it('uploads blobs from all frames and then sends only url+type (blobData)', async () => {
    let sendRequestInput;
    const resourcesPutted = [];

    const blob1 = {url: 'blobUrl1', type: 'blobType1', value: {someKey1: 'bla1'}};
    const blob2 = {url: 'blobUrl2', type: 'blobType2', value: {someKey2: 'bla2'}};
    const blob3 = {url: 'blobUrl3', type: 'blobType3', value: {someKey3: 'bla3'}};
    const blobs = [blob1];
    const resourceUrls = 'resourceUrls';
    const url = 'url';
    const cdt = 'cdt';
    const innerFrame = {
      url: 'url2',
      resourceUrls: [],
      blobs: [blob1, blob3],
      cdt: 'cdt2',
      frames: [],
    };
    const frames = [
      {url: 'url1', resourceUrls: [], blobs: [blob1, blob2], cdt: 'cdt1', frames: [innerFrame]},
    ];
    const eyesCheckWindow = makeEyesCheckWindow({sendRequest, processPage});

    await eyesCheckWindow('bla doc');

    expect(sendRequestInput).to.eql({
      command: 'checkWindow',
      data: {
        url,
        cdt,
        resourceUrls,
        blobData: [{url: 'blobUrl1', type: 'blobType1'}],
        frames: [
          {
            url: 'url1',
            resourceUrls: [],
            blobData: [{url: 'blobUrl1', type: 'blobType1'}, {url: 'blobUrl2', type: 'blobType2'}],
            cdt: 'cdt1',
            frames: [
              {
                url: 'url2',
                resourceUrls: [],
                blobData: [
                  {url: 'blobUrl1', type: 'blobType1'},
                  {url: 'blobUrl3', type: 'blobType3'},
                ],
                cdt: 'cdt2',
                frames: [],
              },
            ],
          },
        ],
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
        debugCdt: undefined,
      },
    });
    expect(resourcesPutted).to.eql([
      {
        command: `resource/blobUrl1`,
        data: {someKey1: 'bla1'},
        headers: {
          'Content-Type': 'application/octet-stream',
        },
        method: 'PUT',
      },
      {
        command: `resource/blobUrl2`,
        data: {someKey2: 'bla2'},
        headers: {
          'Content-Type': 'application/octet-stream',
        },
        method: 'PUT',
      },
      {
        command: `resource/blobUrl3`,
        data: {someKey3: 'bla3'},
        headers: {
          'Content-Type': 'application/octet-stream',
        },
        method: 'PUT',
      },
    ]);

    function sendRequest(arg) {
      if (arg.command === 'checkWindow') sendRequestInput = arg;
      else {
        resourcesPutted.push(arg);
      }
    }

    async function processPage() {
      return {resourceUrls, blobs, frames, url, cdt};
    }
  });

  it('uploads blobs from all frames and then sends only url+type (blobData)', async () => {
    let sendRequestInput;
    const resourcesPutted = [];

    const blob1 = {url: 'blobUrl', value: {someKey: 'bla'}};
    const blobs = [blob1];
    const resourceUrls = 'resourceUrls';
    const url = 'url';
    const cdt = 'cdt';
    const eyesCheckWindow = makeEyesCheckWindow({sendRequest, processPage});

    await eyesCheckWindow('bla doc');

    expect(sendRequestInput).to.eql({
      command: 'checkWindow',
      data: {
        url,
        cdt,
        resourceUrls,
        blobData: [{url: 'blobUrl', type: 'application/x-applitools-unknown'}],
        frames: [],
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
        debugCdt: undefined,
      },
    });
    expect(resourcesPutted).to.eql([
      {
        command: `resource/blobUrl`,
        data: {someKey: 'bla'},
        headers: {
          'Content-Type': 'application/octet-stream',
        },
        method: 'PUT',
      },
    ]);

    function sendRequest(arg) {
      if (arg.command === 'checkWindow') sendRequestInput = arg;
      else {
        resourcesPutted.push(arg);
      }
    }

    async function processPage() {
      return {resourceUrls, blobs, frames: [], url, cdt};
    }
  });
});
