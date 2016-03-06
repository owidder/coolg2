'use strict';

(function () {

    function zero2DimArray(dim1, dim2) {
        if(!(dim2 > 0)) {
            dim2 = dim1;
        }
        var zeroArray = [];
        var i, j;
        for(i = 0; i < dim1; i++) {
            zeroArray.push([]);
            for(j = 0; j < dim2; j++) {
                zeroArray[i].push(0);
            }
        }

        return zeroArray;
    }

    math.import({
        zero2DimArray: zero2DimArray
    });
})();