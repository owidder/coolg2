'use strict';

angular.module(com_geekAndPoke_coolg.moduleName).factory('funcs', function() {
    function _if(boolean, trueBody) {
        if(boolean) {
            trueBody();
        }

        function _else(falseBody) {
            if(!boolean) {
                falseBody();
            }
        }

        return {
            else: _else
        }
    }

    function forEachKeyAndVal(v, fkt) {
        var key, ret;
        for(key in v) {
            if(v.hasOwnProperty(key)) {
                ret = fkt(key, v[key]);
                if(typeof(ret) == 'boolean' && !ret) {
                    break;
                }
            }
        }
    }

    function forEachKeyAndValWithIndex(v, fkt) {
        var key;
        var j = 0;
        for(key in v) {
            if(v.hasOwnProperty(key)) {
                fkt(key, v[key], j++);
            }
        }
    }

    function forEachKey(v, fkt) {
        forEachKeyAndVal(v, function(key, val) {
            fkt(key);
        });
    }

    function forEachVal(v, fkt) {
        forEachKeyAndVal(v, function(key, val) {
            fkt(val);
        });
    }

    function syncFor(ctr, end, asyncBody) {
        if(ctr == end) {
            return;
        }
        asyncBody().then(function() {
            syncFor(ctr+1, end, asyncBody);
        });
    }

    function makeAccessorFunction(accessor) {
        if(typeof(accessor) == 'function') {
            return accessor;
        }

        return function(obj) {
            return obj[accessor];
        }
    }

    function addObjectToArray(array, objToAdd, idAttr) {
        var found = false;
        var accessor = makeAccessorFunction(idAttr);
        array.forEach(function(obj) {
            if(accessor(obj) == accessor(objToAdd)) {
                forEachKeyAndVal(objToAdd, function(key, val) {
                    obj[key] = val;
                });
                obj.___added = true;
                found = true;
                return false;
            }
        });

        if(!found) {
            objToAdd.___added = true;
            array.push(objToAdd);
        }
    }

    function clearAllNotAdded(array) {
        var added, i;
        for(i = array.length -1; i >= 0 ; i--){
            added = array[i].___added;
            delete(array[i].___added);
            if(added != true){
                array.splice(i, 1);
            }
        }
    }

    function searchForIndexOfObjectInArray(array, valueToSearchFor, valueAttr) {
        var foundIndex = 0;
        var index = 0;
        var accessor = makeAccessorFunction(valueAttr);
        array.forEach(function(obj) {
            if(accessor(obj) == valueToSearchFor) {
                foundIndex = index;
                return false;
            }
            index++;
        });

        return foundIndex;
    }

    function searchObjectInArray(array, valueToSearchFor, valueAttr) {
        var foundObj;
        var index = searchForIndexOfObjectInArray(array, valueToSearchFor, valueAttr);
        if(index < array.length) {
            foundObj = array[index];
        }

        return foundObj;
    }

    function identity(o) {
        return o;
    }

    function isString(s) {
        return typeof(s) == 'string';
    }

    function isFunction(f) {
        return typeof(f) == 'function';
    }

    function isDefined(v) {
        if (typeof(v) === 'undefined') {
            return false;
        }

        return true;
    }

    function isSet(v) {
        return (isDefined(v) && v != null);
    }

    function isEmpty(v) {
        return !isSet(v) || v.length == 0;
    }

    function isArray(obj) {
        return obj.constructor.name == 'Array';
    }

    function isInArray(a, o) {
        return (a.indexOf(o) > -1);
    }

    function maxAttribute(o) {
        var maxKey, maxVal = -Number.MAX_VALUE;
        forEachKeyAndVal(o, function(k, v) {
            if(v > maxVal) {
                maxKey = k;
                maxVal = v;
            }
        });

        return maxKey;
    }

    function sumAttributes(o) {
        var sum = 0;
        forEachVal(function(v) {
            sum += v;
        });

        return v;
    }

    function hashCode(string){
        var hash = 0;
        if (string.length == 0) return hash;
        for (var i = 0; i < string.length; i++) {
            var char = string.charCodeAt(i);
            hash = ((hash<<5)-hash)+char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash;
    }

    function sortArray(array, attributeName, descendingFlag) {
        var orderToggle = (descendingFlag ? -1 : 1);
        var orderedArray = array.slice().sort(function(a, b) {
            var valA = a[attributeName];
            var valB = b[attributeName];
            if(valA > valB) {
                return orderToggle;
            }
            else if(valA < valB) {
                return orderToggle * (-1);
            }

            return 0;
        });

        return orderedArray;
    }

    function putInArrayMap(arrayMap, key, obj) {
        if(!isDefined(arrayMap[key])) {
            arrayMap[key] = [];
        }
        arrayMap[key].push(obj);
    }

    function upperFirst(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    function setPropertyIfValueNotEmpty(map, propertyName, value) {
        if(!isEmpty(value)) {
            map[propertyName] = value;
        }
    }

    function get(obj, propertyName) {
        var value;

        if(isDefined(obj)) {
            value = obj[propertyName];
        }

        return value;
    }

    function createAccessorFunction(a) {
        var accessorFunction;
        if(isFunction(a)) {
            accessorFunction = a;
        }
        if(isString(a)) {
            accessorFunction = function(obj) {
                return obj[a];
            }
        }

        return accessorFunction;
    }

    function createComparator(accessor) {
        var accessorFunction = createAccessorFunction(accessor);
        return function(a,b) {
            var valA = accessorFunction(a);
            var valB = accessorFunction(b);
            if(valA < valB) {
                return -1;
            }
            else if (valA == valB) {
                return 0;
            }
            return 1;
        }
    }

    /**
     *
     * @param arr1
     * @param arr2
     * @param destination -> [[arr1[0],arr2[0]], [arr1[0],arr2[0]], ...]
     * @return destination
     */
    function combineArrays(arr1, arr2, destination) {
        var minLength = Math.min(arr1.length, arr2.length);
        var i;
        if(!isArray(destination)) {
            destination = [];
        }
        destination.length = 0;
        for(i = 0; i < minLength; i++) {
            destination.push([arr1[i], arr2[i]]);
        }

        return destination;
    }

    return {
        hashCode: hashCode,
        if: _if,
        isDefined: isDefined,
        isEmpty: isEmpty,
        isSet: isSet,
        isString: isString,
        isArray: isArray,
        isInArray: isInArray,
        forEachKeyAndVal: forEachKeyAndVal,
        forEachKeyAndValWithIndex: forEachKeyAndValWithIndex,
        forEachKey: forEachKey,
        forEachVal: forEachVal,
        maxAttribute: maxAttribute,
        sumAttributes: sumAttributes,
        addObjectToArray: addObjectToArray,
        clearAllNotAdded: clearAllNotAdded,
        searchObjectInArray: searchObjectInArray,
        identity: identity,
        sortArray: sortArray,
        searchForIndexOfObjectInArray: searchForIndexOfObjectInArray,
        upperFirst: upperFirst,
        putInArrayMap: putInArrayMap,
        setPropertyIfValueNotEmpty: setPropertyIfValueNotEmpty,
        get: get,
        createAccessorFunction: createAccessorFunction,
        createComparator: createComparator,
        combineArrays: combineArrays
    };
});
