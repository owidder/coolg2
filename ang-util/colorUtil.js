'use strict';

angular.module(com_geekAndPoke_coolg.moduleName).factory("colorUtil", function(mathUtil) {

    /**
     * Thanks to http://www.javascripter.net/faq/rgb2cmyk.htm
     * @param r
     * @param g
     * @param b
     * @returns {*}
     */
    function rgb2cmyk (r,g,b) {
        var computedC = 0;
        var computedM = 0;
        var computedY = 0;
        var computedK = 0;

        //remove spaces from input RGB values, convert to int
        var r = parseInt( (''+r).replace(/\s/g,''),10 );
        var g = parseInt( (''+g).replace(/\s/g,''),10 );
        var b = parseInt( (''+b).replace(/\s/g,''),10 );

        if ( r==null || g==null || b==null ||
            isNaN(r) || isNaN(g)|| isNaN(b) )
        {
            alert ('Please enter numeric RGB values!');
            return;
        }
        if (r<0 || g<0 || b<0 || r>255 || g>255 || b>255) {
            alert ('RGB values must be in the range 0 to 255.');
            return;
        }

        // BLACK
        if (r==0 && g==0 && b==0) {
            computedK = 1;
            return [0,0,0,1];
        }

        computedC = 1 - (r/255);
        computedM = 1 - (g/255);
        computedY = 1 - (b/255);

        var minCMY = Math.min(computedC,
            Math.min(computedM,computedY));
        computedC = (computedC - minCMY) / (1 - minCMY) ;
        computedM = (computedM - minCMY) / (1 - minCMY) ;
        computedY = (computedY - minCMY) / (1 - minCMY) ;
        computedK = minCMY;

        return {
            c: computedC,
            m: computedM,
            y: computedY,
            k: computedK
        };
    }

    /**
     *
     * @param rgbString e.g. "#a2e67f"
     * @return r,g and b value (base 10)
     */
    function rgbStringToRgbValues(rgbString) {
        var r16 = rgbString.substr(1, 2);
        var g16 = rgbString.substr(3, 2);
        var b16 = rgbString.substr(5, 2);

        var r10 = mathUtil.hexToDec(r16);
        var g10 = mathUtil.hexToDec(g16);
        var b10 = mathUtil.hexToDec(b16);

        return {
            r: r10,
            g: g10,
            b: b10
        }
    }

    /**
     *
     * @param rgb "#<6 hex digit>" e.g.: "#a76e42"
     */
    function getBlackFromRgbString(rgbString) {
        var rgb = rgbStringToRgbValues(rgbString);
        var cmyk = rgb2cmyk(rgb.r, rgb.g, rgb.b);

        return cmyk.k;
    }

    /**
     * from: http://stackoverflow.com/questions/2353211/hsl-to-rgb-color-conversion
     *
     * Converts an RGB color value to HSL. Conversion formula
     * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
     * Assumes r, g, and b are contained in the set [0, 255] and
     * returns h, s, and l in the set [0, 1].
     *
     * @param   Number  r       The red color value
     * @param   Number  g       The green color value
     * @param   Number  b       The blue color value
     * @return  Array           The HSL representation
     */
    function rgbToHsl(r, g, b){
        r /= 255, g /= 255, b /= 255;
        var max = Math.max(r, g, b), min = Math.min(r, g, b);
        var h, s, l = (max + min) / 2;

        if(max == min){
            h = s = 0; // achromatic
        }else{
            var d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch(max){
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }

        return {
            h: h,
            s: s,
            l: l
        };
    }

    /**
     *
     * @param rgbString e.g. "#87e3af"
     */
    function getSaturationFromRgbString(rgbString) {
        var rgb = rgbStringToRgbValues(rgbString);
        var hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

        return hsl.s;

    }

    /**
     *
     * @param rgbString e.g. "#87e3af"
     */
    function getLightFromRgbString(rgbString) {
        var rgb = rgbStringToRgbValues(rgbString);
        var hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

        return hsl.l;

    }

    function getOptimalTextColorFromRgbString(rgbString) {
        var darkness = getBlackFromRgbString(rgbString);
        var rgb = rgbStringToRgbValues(rgbString);
        if(darkness > 0.2 || (rgb.b > 200 && rgb.g < 100)) {
            return "white";
        }
        else {
            return "black";
        }
    }

    return {
        rgb2cmyk: rgb2cmyk,
        rgbToHsl: rgbToHsl,
        getBlackFromRgbString: getBlackFromRgbString,
        rgbStringToRgbValues: rgbStringToRgbValues,
        getSaturationFromRgbString: getSaturationFromRgbString,
        getLightFromRgbString: getLightFromRgbString,
        getOptimalTextColorFromRgbString: getOptimalTextColorFromRgbString
    }
});
