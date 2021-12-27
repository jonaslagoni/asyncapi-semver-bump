const { logInfo, logError, bumpVersion, analyseVersionChange, collectReferences, getRelatedGitCommits } = require('../src/utils');
describe('Utils', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  describe('collectReferences', () => {
    test('should collect correct references', () => {
      const obj = {
        test: {
          $ref: '1',
          test: {
            $ref: '2'
          }
        },
        test2: {
          $ref: '3'
        }
      };
      const list = collectReferences(obj);
      const expectedList = ['1', '2', '3'];
      expect(list).toEqual(expectedList);
    });
  });
  describe('getRelatedGitCommits', () => {
    test('should exit when no commits', () => {
      const spy = jest.spyOn(global.process, 'exit').mockImplementationOnce(() => {});
      jest.spyOn(global.console, 'info').mockImplementation(() => { return; });
      jest.spyOn(global.console, 'error').mockImplementation(() => { return; });
      const asyncapiFilePath = 'asyncapi.json';
      const referencedFiles = [];
      const events = {commits: []};
      getRelatedGitCommits(asyncapiFilePath, referencedFiles, events, '');
      expect(spy).toHaveBeenCalled();
    });
    test('should filter asyncapi file modification', () => {
      const asyncapiFilePath = 'asyncapi.json';
      const referencedFiles = [];
      const events = {commits: [{message: 'message', modified: ['asyncapi.json']}]};
      const relatedCommits = getRelatedGitCommits(asyncapiFilePath, referencedFiles, events, '');
      expect(relatedCommits).toEqual(['message\n']);
    });
    test('should filter events referenced file modifications', () => {
      const asyncapiFilePath = 'asyncapi.json';
      const referencedFiles = ['components/test.json'];
      const events = {commits: [{message: 'message', modified: ['components/test.json']}]};
      const relatedCommits = getRelatedGitCommits(asyncapiFilePath, referencedFiles, events, '');
      expect(relatedCommits).toEqual(['message\n']);
    });
    test('should match correct workflow path', () => {
      const asyncapiFilePath = '/test/workspace/asyncapi.json';
      const referencedFiles = ['/test/workspace/components/test.json'];
      const events = {commits: [{message: 'message', modified: ['components/test.json']}]};
      const relatedCommits = getRelatedGitCommits(asyncapiFilePath, referencedFiles, events, '/test/workspace');
      expect(relatedCommits).toEqual(['message\n']);
    });
  });
  describe('logInfo', () => {
    test('should log correct message', () => {
      const spy = jest.spyOn(global.console, 'info').mockImplementation(() => { return; });
      const message = 'message';
      logInfo(message);
      expect(spy).toHaveBeenNthCalledWith(1, message);
    });
  });
  describe('logError', () => {
    test('should log correct message', () => {
      const spy = jest.spyOn(global.console, 'error').mockImplementation(() => { return; });
      const message = 'message';
      logError(message);
      expect(spy).toHaveBeenNthCalledWith(1, `✖  fatal     ${message}`);
    });
  });
  describe('bumpVersion', () => {
    test('should bump major version', () => {
      const newVersion = bumpVersion('0.0.0', true, false, false, false, undefined);
      expect(newVersion).toEqual('1.0.0');
    });
    test('should bump minor version', () => {
      const newVersion = bumpVersion('0.0.0', false, true, false, false, undefined);
      expect(newVersion).toEqual('0.1.0');
    });
    test('should bump fix version', () => {
      const newVersion = bumpVersion('0.0.0', false, false, true, false, undefined);
      expect(newVersion).toEqual('0.0.1');
    });
    test('should bump prerelease version', () => {
      const newVersion = bumpVersion('0.0.0', false, false, false, true, 'pre');
      expect(newVersion).toEqual('0.0.1-pre.0');
    });
    test('should bump existing prerelease version', () => {
      const newVersion = bumpVersion('0.0.1-pre.0', false, false, false, true, 'pre');
      expect(newVersion).toEqual('0.0.1-pre.1');
    });
    test('should bump existing prerelease version to new prerelease id', () => {
      const newVersion = bumpVersion('0.0.1-pre.0', false, false, false, true, 'pre2');
      expect(newVersion).toEqual('0.0.1-pre2.0');
    });
  });
  describe('analyseVersionChange', () => {
    test('figure out to bump major version', () => {
      const {doMajorVersion, doMinorVersion, doPatchVersion, doPreReleaseVersion} = analyseVersionChange('feat!', '', '', '', ['feat!: change request']);
      expect(doMajorVersion).toEqual(true);
      expect(doMinorVersion).toEqual(false);
      expect(doPatchVersion).toEqual(false);
      expect(doPreReleaseVersion).toEqual(false);
    });
    test('figure out to bump minor version', () => {
      const {doMajorVersion, doMinorVersion, doPatchVersion, doPreReleaseVersion} = analyseVersionChange('feat!', 'feat', '', '', ['feat: change request']);
      expect(doMajorVersion).toEqual(false);
      expect(doMinorVersion).toEqual(true);
      expect(doPatchVersion).toEqual(false);
      expect(doPreReleaseVersion).toEqual(false);
    });
    test('figure out to bump patch version', () => {
      const {doMajorVersion, doMinorVersion, doPatchVersion, doPreReleaseVersion} = analyseVersionChange('feat!', 'feat', 'fix', '', ['fix: change request']);
      expect(doMajorVersion).toEqual(false);
      expect(doMinorVersion).toEqual(false);
      expect(doPatchVersion).toEqual(true);
      expect(doPreReleaseVersion).toEqual(false);
    });
    test('figure out to bump pre-release version', () => {
      const {doMajorVersion, doMinorVersion, doPatchVersion, doPreReleaseVersion} = analyseVersionChange('feat!', 'feat', 'fix', 'pre', ['pre: change request']);
      expect(doMajorVersion).toEqual(false);
      expect(doMinorVersion).toEqual(false);
      expect(doPatchVersion).toEqual(false);
      expect(doPreReleaseVersion).toEqual(true);
    });
  });
});