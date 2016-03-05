'use strict';

describe(com_eosItServices_fx.subModule('version module'), function () {
    beforeEach(module(com_eosItServices_fx.subModule('version')));

    describe('version service', function () {
        it('should return current version', inject(function (version) {
            expect(version).toEqual('0.1');
        }));
    });
});
