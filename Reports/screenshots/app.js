var app = angular.module('reportingApp', []);

//<editor-fold desc="global helpers">

var isValueAnArray = function (val) {
    return Array.isArray(val);
};

var getSpec = function (str) {
    var describes = str.split('|');
    return describes[describes.length - 1];
};
var checkIfShouldDisplaySpecName = function (prevItem, item) {
    if (!prevItem) {
        item.displaySpecName = true;
    } else if (getSpec(item.description) !== getSpec(prevItem.description)) {
        item.displaySpecName = true;
    }
};

var getParent = function (str) {
    var arr = str.split('|');
    str = "";
    for (var i = arr.length - 2; i > 0; i--) {
        str += arr[i] + " > ";
    }
    return str.slice(0, -3);
};

var getShortDescription = function (str) {
    return str.split('|')[0];
};

var countLogMessages = function (item) {
    if ((!item.logWarnings || !item.logErrors) && item.browserLogs && item.browserLogs.length > 0) {
        item.logWarnings = 0;
        item.logErrors = 0;
        for (var logNumber = 0; logNumber < item.browserLogs.length; logNumber++) {
            var logEntry = item.browserLogs[logNumber];
            if (logEntry.level === 'SEVERE') {
                item.logErrors++;
            }
            if (logEntry.level === 'WARNING') {
                item.logWarnings++;
            }
        }
    }
};

var defaultSortFunction = function sortFunction(a, b) {
    if (a.sessionId < b.sessionId) {
        return -1;
    }
    else if (a.sessionId > b.sessionId) {
        return 1;
    }

    if (a.timestamp < b.timestamp) {
        return -1;
    }
    else if (a.timestamp > b.timestamp) {
        return 1;
    }

    return 0;
};


//</editor-fold>

app.controller('ScreenshotReportController', function ($scope, $http) {
    var that = this;
    var clientDefaults = {};

    $scope.searchSettings = Object.assign({
        description: '',
        allselected: true,
        passed: true,
        failed: true,
        pending: true,
        withLog: true
    }, clientDefaults.searchSettings || {}); // enable customisation of search settings on first page hit

    var initialColumnSettings = clientDefaults.columnSettings; // enable customisation of visible columns on first page hit
    if (initialColumnSettings) {
        if (initialColumnSettings.displayTime !== undefined) {
            // initial settings have be inverted because the html bindings are inverted (e.g. !ctrl.displayTime)
            this.displayTime = !initialColumnSettings.displayTime;
        }
        if (initialColumnSettings.displayBrowser !== undefined) {
            this.displayBrowser = !initialColumnSettings.displayBrowser; // same as above
        }
        if (initialColumnSettings.displaySessionId !== undefined) {
            this.displaySessionId = !initialColumnSettings.displaySessionId; // same as above
        }
        if (initialColumnSettings.displayOS !== undefined) {
            this.displayOS = !initialColumnSettings.displayOS; // same as above
        }
        if (initialColumnSettings.inlineScreenshots !== undefined) {
            this.inlineScreenshots = initialColumnSettings.inlineScreenshots; // this setting does not have to be inverted
        } else {
            this.inlineScreenshots = false;
        }
    }

    this.showSmartStackTraceHighlight = true;

    this.chooseAllTypes = function () {
        var value = true;
        $scope.searchSettings.allselected = !$scope.searchSettings.allselected;
        if (!$scope.searchSettings.allselected) {
            value = false;
        }

        $scope.searchSettings.passed = value;
        $scope.searchSettings.failed = value;
        $scope.searchSettings.pending = value;
        $scope.searchSettings.withLog = value;
    };

    this.isValueAnArray = function (val) {
        return isValueAnArray(val);
    };

    this.getParent = function (str) {
        return getParent(str);
    };

    this.getSpec = function (str) {
        return getSpec(str);
    };

    this.getShortDescription = function (str) {
        return getShortDescription(str);
    };

    this.convertTimestamp = function (timestamp) {
        var d = new Date(timestamp),
            yyyy = d.getFullYear(),
            mm = ('0' + (d.getMonth() + 1)).slice(-2),
            dd = ('0' + d.getDate()).slice(-2),
            hh = d.getHours(),
            h = hh,
            min = ('0' + d.getMinutes()).slice(-2),
            ampm = 'AM',
            time;

        if (hh > 12) {
            h = hh - 12;
            ampm = 'PM';
        } else if (hh === 12) {
            h = 12;
            ampm = 'PM';
        } else if (hh === 0) {
            h = 12;
        }

        // ie: 2013-02-18, 8:35 AM
        time = yyyy + '-' + mm + '-' + dd + ', ' + h + ':' + min + ' ' + ampm;

        return time;
    };


    this.round = function (number, roundVal) {
        return (parseFloat(number) / 1000).toFixed(roundVal);
    };


    this.passCount = function () {
        var passCount = 0;
        for (var i in this.results) {
            var result = this.results[i];
            if (result.passed) {
                passCount++;
            }
        }
        return passCount;
    };


    this.pendingCount = function () {
        var pendingCount = 0;
        for (var i in this.results) {
            var result = this.results[i];
            if (result.pending) {
                pendingCount++;
            }
        }
        return pendingCount;
    };


    this.failCount = function () {
        var failCount = 0;
        for (var i in this.results) {
            var result = this.results[i];
            if (!result.passed && !result.pending) {
                failCount++;
            }
        }
        return failCount;
    };

    this.passPerc = function () {
        return (this.passCount() / this.totalCount()) * 100;
    };
    this.pendingPerc = function () {
        return (this.pendingCount() / this.totalCount()) * 100;
    };
    this.failPerc = function () {
        return (this.failCount() / this.totalCount()) * 100;
    };
    this.totalCount = function () {
        return this.passCount() + this.failCount() + this.pendingCount();
    };

    this.applySmartHighlight = function (line) {
        if (this.showSmartStackTraceHighlight) {
            if (line.indexOf('node_modules') > -1) {
                return 'greyout';
            }
            if (line.indexOf('  at ') === -1) {
                return '';
            }

            return 'highlight';
        }
        return true;
    };

    var results = [
    {
        "description": "Testing for Thai Language|Testing change of language",
        "passed": false,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 10112,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": [
            "Failed: stale element reference: element is not attached to the page document\n  (Session info: chrome=71.0.3578.98)\n  (Driver info: chromedriver=2.45.615291 (ec3682e3c9061c10f26ea9e5cdcf3c53f3f74387),platform=Windows NT 6.1.7601 SP1 x86_64)"
        ],
        "trace": [
            "StaleElementReferenceError: stale element reference: element is not attached to the page document\n  (Session info: chrome=71.0.3578.98)\n  (Driver info: chromedriver=2.45.615291 (ec3682e3c9061c10f26ea9e5cdcf3c53f3f74387),platform=Windows NT 6.1.7601 SP1 x86_64)\n    at Object.checkLegacyResponse (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\error.js:546:15)\n    at parseHttpResponse (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\http.js:509:13)\n    at doSend.then.response (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\http.js:441:30)\n    at processTicksAndRejections (internal/process/next_tick.js:81:5)\nFrom: Task: WebElement.getText()\n    at Driver.schedule (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\webdriver.js:807:17)\n    at WebElement.schedule_ (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\webdriver.js:2010:25)\n    at WebElement.getText (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\webdriver.js:2277:17)\n    at actionFn (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:89:44)\n    at Array.map (<anonymous>)\n    at actionResults.getWebElements.then (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:461:65)\n    at ManagedPromise.invokeCallback_ (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as getText] (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.(anonymous function).args [as getText] (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at UserContext.<anonymous> (C:\\Users\\mindfire\\Desktop\\ProtractorNew\\Test Cases\\LanguageTest.js:17:51)\n    at C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as isDisplayed] (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.(anonymous function).args [as isDisplayed] (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at UserContext.<anonymous> (C:\\Users\\mindfire\\Desktop\\ProtractorNew\\Test Cases\\LanguageTest.js:17:61)\n    at C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\nFrom: Task: Run it(\"Testing for Thai Language\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at shutdownTask_.MicroTask (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\mindfire\\Desktop\\ProtractorNew\\Test Cases\\LanguageTest.js:13:5)\n    at addSpecsToSuite (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\mindfire\\Desktop\\ProtractorNew\\Test Cases\\LanguageTest.js:9:1)\n    at Module._compile (internal/modules/cjs/loader.js:736:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:747:10)\n    at Module.load (internal/modules/cjs/loader.js:628:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:568:12)"
        ],
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://www.airasia.com/booking/main.50d4b5f1246487990501.js 0 Synchronous XMLHttpRequest on the main thread is deprecated because of its detrimental effects to the end user's experience. For more help, check https://xhr.spec.whatwg.org/.",
                "timestamp": 1549624991523,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://www.airasia.com/booking/main.50d4b5f1246487990501.js 0:1686501 \"Deprecation warning: moment().add(period, number) is deprecated. Please use moment().add(number, period). See http://momentjs.com/guides/#/warnings/add-inverted-param/ for more info.\"",
                "timestamp": 1549624992793,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://www.airasia.com/booking/main.50d4b5f1246487990501.js 0:1186101 \"\\n      It looks like you're using the disabled attribute with a reactive form directive. If you set disabled to true\\n      when you set up this control in your component class, the disabled attribute will actually be set in the DOM for\\n      you. We recommend using this approach to avoid 'changed after checked' errors.\\n       \\n      Example: \\n      form = new FormGroup({\\n        first: new FormControl({value: 'Nancy', disabled: true}, Validators.required),\\n        last: new FormControl('Drew', Validators.required)\\n      });\\n    \"",
                "timestamp": 1549624993602,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://www.airasia.com/booking/main.50d4b5f1246487990501.js 0:1186101 \"\\n      It looks like you're using the disabled attribute with a reactive form directive. If you set disabled to true\\n      when you set up this control in your component class, the disabled attribute will actually be set in the DOM for\\n      you. We recommend using this approach to avoid 'changed after checked' errors.\\n       \\n      Example: \\n      form = new FormGroup({\\n        first: new FormControl({value: 'Nancy', disabled: true}, Validators.required),\\n        last: new FormControl('Drew', Validators.required)\\n      });\\n    \"",
                "timestamp": 1549624993624,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://ssor.airasia.com/sso/v2/authorization?clientId=AA001AP - Failed to load resource: the server responded with a status of 401 ()",
                "timestamp": 1549624997687,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://ssor.airasia.com/sso/v2/authorization?clientId=AA001AP - Failed to load resource: the server responded with a status of 401 ()",
                "timestamp": 1549624998557,
                "type": ""
            }
        ],
        "screenShotFile": "007d00da-00ea-0029-0072-006a000a00b6.png",
        "timestamp": 1549624986335,
        "duration": 14336
    },
    {
        "description": "testing for traditiona Chinese|Testing change of language",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 10112,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://ssor.airasia.com/sso/v2/authorization?clientId=AA001AP - Failed to load resource: the server responded with a status of 401 ()",
                "timestamp": 1549625000900,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://ssor.airasia.com/sso/v2/authorization?clientId=AA001AP - Failed to load resource: the server responded with a status of 401 ()",
                "timestamp": 1549625002159,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://ssor.airasia.com/sso/v2/authorization?clientId=AA001AP - Failed to load resource: the server responded with a status of 401 ()",
                "timestamp": 1549625006352,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://ssor.airasia.com/sso/v2/authorization?clientId=AA001AP - Failed to load resource: the server responded with a status of 401 ()",
                "timestamp": 1549625006930,
                "type": ""
            }
        ],
        "screenShotFile": "006700a5-006f-00fb-00f1-00fb00b2004a.png",
        "timestamp": 1549625002144,
        "duration": 5706
    },
    {
        "description": "testing for Indonesian|Testing change of language",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 10112,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://ssor.airasia.com/sso/v2/authorization?clientId=AA001AP - Failed to load resource: the server responded with a status of 401 ()",
                "timestamp": 1549625012612,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://ssor.airasia.com/sso/v2/authorization?clientId=AA001AP - Failed to load resource: the server responded with a status of 401 ()",
                "timestamp": 1549625013251,
                "type": ""
            }
        ],
        "screenShotFile": "00d0005f-0060-0029-008f-00d8001d0019.png",
        "timestamp": 1549625008862,
        "duration": 6004
    },
    {
        "description": "testing for Malaysian|Testing change of language",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 10112,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://ssor.airasia.com/sso/v2/authorization?clientId=AA001AP - Failed to load resource: the server responded with a status of 401 ()",
                "timestamp": 1549625020479,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://ssor.airasia.com/sso/v2/authorization?clientId=AA001AP - Failed to load resource: the server responded with a status of 401 ()",
                "timestamp": 1549625021287,
                "type": ""
            }
        ],
        "screenShotFile": "002700cd-00c9-0053-002f-0063009a00b7.png",
        "timestamp": 1549625015987,
        "duration": 7076
    },
    {
        "description": "Testing for Thai Language|Testing change of language",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 5836,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://www.airasia.com/booking/main.50d4b5f1246487990501.js 0 Synchronous XMLHttpRequest on the main thread is deprecated because of its detrimental effects to the end user's experience. For more help, check https://xhr.spec.whatwg.org/.",
                "timestamp": 1549625112593,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://www.airasia.com/booking/main.50d4b5f1246487990501.js 0:1686501 \"Deprecation warning: moment().add(period, number) is deprecated. Please use moment().add(number, period). See http://momentjs.com/guides/#/warnings/add-inverted-param/ for more info.\"",
                "timestamp": 1549625113769,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://www.airasia.com/booking/main.50d4b5f1246487990501.js 0:1186101 \"\\n      It looks like you're using the disabled attribute with a reactive form directive. If you set disabled to true\\n      when you set up this control in your component class, the disabled attribute will actually be set in the DOM for\\n      you. We recommend using this approach to avoid 'changed after checked' errors.\\n       \\n      Example: \\n      form = new FormGroup({\\n        first: new FormControl({value: 'Nancy', disabled: true}, Validators.required),\\n        last: new FormControl('Drew', Validators.required)\\n      });\\n    \"",
                "timestamp": 1549625114625,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://www.airasia.com/booking/main.50d4b5f1246487990501.js 0:1186101 \"\\n      It looks like you're using the disabled attribute with a reactive form directive. If you set disabled to true\\n      when you set up this control in your component class, the disabled attribute will actually be set in the DOM for\\n      you. We recommend using this approach to avoid 'changed after checked' errors.\\n       \\n      Example: \\n      form = new FormGroup({\\n        first: new FormControl({value: 'Nancy', disabled: true}, Validators.required),\\n        last: new FormControl('Drew', Validators.required)\\n      });\\n    \"",
                "timestamp": 1549625114650,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://ssor.airasia.com/sso/v2/authorization?clientId=AA001AP - Failed to load resource: the server responded with a status of 401 ()",
                "timestamp": 1549625119873,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://www.airasia.com/booking/undefined - Failed to load resource: the server responded with a status of 502 ()",
                "timestamp": 1549625121609,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://ssor.airasia.com/sso/v2/authorization?clientId=AA001AP - Failed to load resource: the server responded with a status of 401 ()",
                "timestamp": 1549625121636,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://ssor.airasia.com/sso/v2/authorization?clientId=AA001AP - Failed to load resource: the server responded with a status of 401 ()",
                "timestamp": 1549625121867,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://ssor.airasia.com/sso/v2/authorization?clientId=AA001AP - Failed to load resource: the server responded with a status of 401 ()",
                "timestamp": 1549625122316,
                "type": ""
            }
        ],
        "screenShotFile": "00b700f2-004e-0094-00c0-009f0065003d.png",
        "timestamp": 1549625108709,
        "duration": 13949
    },
    {
        "description": "testing for traditiona Chinese|Testing change of language",
        "passed": false,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 5836,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": [
            "Failed: stale element reference: element is not attached to the page document\n  (Session info: chrome=71.0.3578.98)\n  (Driver info: chromedriver=2.45.615291 (ec3682e3c9061c10f26ea9e5cdcf3c53f3f74387),platform=Windows NT 6.1.7601 SP1 x86_64)"
        ],
        "trace": [
            "StaleElementReferenceError: stale element reference: element is not attached to the page document\n  (Session info: chrome=71.0.3578.98)\n  (Driver info: chromedriver=2.45.615291 (ec3682e3c9061c10f26ea9e5cdcf3c53f3f74387),platform=Windows NT 6.1.7601 SP1 x86_64)\n    at Object.checkLegacyResponse (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\error.js:546:15)\n    at parseHttpResponse (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\http.js:509:13)\n    at doSend.then.response (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\http.js:441:30)\n    at processTicksAndRejections (internal/process/next_tick.js:81:5)\nFrom: Task: WebElement.getText()\n    at Driver.schedule (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\webdriver.js:807:17)\n    at WebElement.schedule_ (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\webdriver.js:2010:25)\n    at WebElement.getText (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\webdriver.js:2277:17)\n    at actionFn (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:89:44)\n    at Array.map (<anonymous>)\n    at actionResults.getWebElements.then (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:461:65)\n    at ManagedPromise.invokeCallback_ (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as getText] (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.(anonymous function).args [as getText] (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at UserContext.<anonymous> (C:\\Users\\mindfire\\Desktop\\ProtractorNew\\Test Cases\\LanguageTest.js:41:51)\n    at C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as isDisplayed] (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.(anonymous function).args [as isDisplayed] (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at UserContext.<anonymous> (C:\\Users\\mindfire\\Desktop\\ProtractorNew\\Test Cases\\LanguageTest.js:41:61)\n    at C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\nFrom: Task: Run it(\"testing for traditiona Chinese\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at shutdownTask_.MicroTask (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\mindfire\\Desktop\\ProtractorNew\\Test Cases\\LanguageTest.js:37:5)\n    at addSpecsToSuite (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\mindfire\\Desktop\\ProtractorNew\\Test Cases\\LanguageTest.js:9:1)\n    at Module._compile (internal/modules/cjs/loader.js:736:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:747:10)\n    at Module.load (internal/modules/cjs/loader.js:628:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:568:12)"
        ],
        "browserLogs": [],
        "screenShotFile": "0097004c-0010-007b-0058-00ce007c00df.png",
        "timestamp": 1549625123226,
        "duration": 1532
    },
    {
        "description": "testing for Indonesian|Testing change of language",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 5836,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://ssor.airasia.com/sso/v2/authorization?clientId=AA001AP - Failed to load resource: the server responded with a status of 401 ()",
                "timestamp": 1549625125045,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://ssor.airasia.com/sso/v2/authorization?clientId=AA001AP - Failed to load resource: the server responded with a status of 401 ()",
                "timestamp": 1549625125406,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://ssor.airasia.com/sso/v2/authorization?clientId=AA001AP - Failed to load resource: the server responded with a status of 401 ()",
                "timestamp": 1549625130185,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://ssor.airasia.com/sso/v2/authorization?clientId=AA001AP - Failed to load resource: the server responded with a status of 401 ()",
                "timestamp": 1549625130975,
                "type": ""
            }
        ],
        "screenShotFile": "00e60060-00f9-0045-000e-0033006c00fa.png",
        "timestamp": 1549625125383,
        "duration": 6848
    },
    {
        "description": "testing for Malaysian|Testing change of language",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 5836,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://ssor.airasia.com/sso/v2/authorization?clientId=AA001AP - Failed to load resource: the server responded with a status of 401 ()",
                "timestamp": 1549625137684,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://ssor.airasia.com/sso/v2/authorization?clientId=AA001AP - Failed to load resource: the server responded with a status of 401 ()",
                "timestamp": 1549625138595,
                "type": ""
            }
        ],
        "screenShotFile": "0019004a-009c-00c7-003a-008c0043008f.png",
        "timestamp": 1549625133216,
        "duration": 7265
    },
    {
        "description": "Testing for Thai Language|Testing change of language",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 7868,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://www.airasia.com/booking/main.7ed1eefe20843c0ae635.js 0 Synchronous XMLHttpRequest on the main thread is deprecated because of its detrimental effects to the end user's experience. For more help, check https://xhr.spec.whatwg.org/.",
                "timestamp": 1549625583480,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://www.airasia.com/booking/main.7ed1eefe20843c0ae635.js 0:1686500 \"Deprecation warning: moment().add(period, number) is deprecated. Please use moment().add(number, period). See http://momentjs.com/guides/#/warnings/add-inverted-param/ for more info.\"",
                "timestamp": 1549625584413,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://www.airasia.com/booking/main.7ed1eefe20843c0ae635.js 0:1186100 \"\\n      It looks like you're using the disabled attribute with a reactive form directive. If you set disabled to true\\n      when you set up this control in your component class, the disabled attribute will actually be set in the DOM for\\n      you. We recommend using this approach to avoid 'changed after checked' errors.\\n       \\n      Example: \\n      form = new FormGroup({\\n        first: new FormControl({value: 'Nancy', disabled: true}, Validators.required),\\n        last: new FormControl('Drew', Validators.required)\\n      });\\n    \"",
                "timestamp": 1549625585041,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://www.airasia.com/booking/main.7ed1eefe20843c0ae635.js 0:1186100 \"\\n      It looks like you're using the disabled attribute with a reactive form directive. If you set disabled to true\\n      when you set up this control in your component class, the disabled attribute will actually be set in the DOM for\\n      you. We recommend using this approach to avoid 'changed after checked' errors.\\n       \\n      Example: \\n      form = new FormGroup({\\n        first: new FormControl({value: 'Nancy', disabled: true}, Validators.required),\\n        last: new FormControl('Drew', Validators.required)\\n      });\\n    \"",
                "timestamp": 1549625585053,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://ssor.airasia.com/sso/v2/authorization?clientId=AA001AP - Failed to load resource: the server responded with a status of 401 ()",
                "timestamp": 1549625588026,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://ssor.airasia.com/sso/v2/authorization?clientId=AA001AP - Failed to load resource: the server responded with a status of 401 ()",
                "timestamp": 1549625588882,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://k.apiairasia.com/availabledates/api/v1/singleprice/0/0/INR/bbi/DMK/2019-02-08/1/12 - Failed to load resource: the server responded with a status of 460 ()",
                "timestamp": 1549625589444,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://k.apiairasia.com/availabledates/api/v1/singleprice/0/0/INR/bbi/BLR/2019-02-08/1/12 - Failed to load resource: the server responded with a status of 460 ()",
                "timestamp": 1549625589552,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://k.apiairasia.com/availabledates/api/v1/singleprice/0/0/INR/bbi/CCU/2019-02-08/1/12 - Failed to load resource: the server responded with a status of 460 ()",
                "timestamp": 1549625589566,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://ssor.airasia.com/sso/v2/authorization?clientId=AA001AP - Failed to load resource: the server responded with a status of 401 ()",
                "timestamp": 1549625589874,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://ssor.airasia.com/sso/v2/authorization?clientId=AA001AP - Failed to load resource: the server responded with a status of 401 ()",
                "timestamp": 1549625590332,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://k.apiairasia.com/availabledates/api/v1/singleprice/0/0/INR/bbi/DMK/2019-02-08/1/12 - Failed to load resource: the server responded with a status of 460 ()",
                "timestamp": 1549625590455,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://k.apiairasia.com/availabledates/api/v1/singleprice/0/0/INR/bbi/BLR/2019-02-08/1/12 - Failed to load resource: the server responded with a status of 460 ()",
                "timestamp": 1549625590506,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://k.apiairasia.com/availabledates/api/v1/singleprice/0/0/INR/bbi/CCU/2019-02-08/1/12 - Failed to load resource: the server responded with a status of 460 ()",
                "timestamp": 1549625590506,
                "type": ""
            }
        ],
        "screenShotFile": "00990007-0055-0073-007c-0060004300b0.png",
        "timestamp": 1549625580710,
        "duration": 9946
    },
    {
        "description": "testing for traditiona Chinese|Testing change of language",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 7868,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://ssor.airasia.com/sso/v2/authorization?clientId=AA001AP - Failed to load resource: the server responded with a status of 401 ()",
                "timestamp": 1549625595697,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://k.apiairasia.com/availabledates/api/v1/singleprice/0/0/INR/bbi/CCU/2019-02-08/1/12 - Failed to load resource: the server responded with a status of 460 ()",
                "timestamp": 1549625596047,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://ssor.airasia.com/sso/v2/authorization?clientId=AA001AP - Failed to load resource: the server responded with a status of 401 ()",
                "timestamp": 1549625596236,
                "type": ""
            }
        ],
        "screenShotFile": "00e60021-00ef-003b-007d-00cb00c900be.png",
        "timestamp": 1549625591882,
        "duration": 5147
    },
    {
        "description": "testing for Indonesian|Testing change of language",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 7868,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://ssor.airasia.com/sso/v2/authorization?clientId=AA001AP - Failed to load resource: the server responded with a status of 401 ()",
                "timestamp": 1549625601795,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://ssor.airasia.com/sso/v2/authorization?clientId=AA001AP - Failed to load resource: the server responded with a status of 401 ()",
                "timestamp": 1549625602418,
                "type": ""
            }
        ],
        "screenShotFile": "00770046-0008-0070-009d-0032001d003d.png",
        "timestamp": 1549625598109,
        "duration": 5110
    },
    {
        "description": "testing for Malaysian|Testing change of language",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 7868,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://ssor.airasia.com/sso/v2/authorization?clientId=AA001AP - Failed to load resource: the server responded with a status of 401 ()",
                "timestamp": 1549625607720,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://ssor.airasia.com/sso/v2/authorization?clientId=AA001AP - Failed to load resource: the server responded with a status of 401 ()",
                "timestamp": 1549625608321,
                "type": ""
            }
        ],
        "screenShotFile": "0066009b-001b-00f0-0068-009a00cd0004.png",
        "timestamp": 1549625604202,
        "duration": 4504
    },
    {
        "description": "Testing for Thai Language|Testing change of language",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 8944,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://www.airasia.com/booking/main.7ed1eefe20843c0ae635.js 0 Synchronous XMLHttpRequest on the main thread is deprecated because of its detrimental effects to the end user's experience. For more help, check https://xhr.spec.whatwg.org/.",
                "timestamp": 1549625841694,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://www.airasia.com/booking/main.7ed1eefe20843c0ae635.js 0:1686500 \"Deprecation warning: moment().add(period, number) is deprecated. Please use moment().add(number, period). See http://momentjs.com/guides/#/warnings/add-inverted-param/ for more info.\"",
                "timestamp": 1549625843461,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://www.airasia.com/booking/main.7ed1eefe20843c0ae635.js 0:1186100 \"\\n      It looks like you're using the disabled attribute with a reactive form directive. If you set disabled to true\\n      when you set up this control in your component class, the disabled attribute will actually be set in the DOM for\\n      you. We recommend using this approach to avoid 'changed after checked' errors.\\n       \\n      Example: \\n      form = new FormGroup({\\n        first: new FormControl({value: 'Nancy', disabled: true}, Validators.required),\\n        last: new FormControl('Drew', Validators.required)\\n      });\\n    \"",
                "timestamp": 1549625844289,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://www.airasia.com/booking/main.7ed1eefe20843c0ae635.js 0:1186100 \"\\n      It looks like you're using the disabled attribute with a reactive form directive. If you set disabled to true\\n      when you set up this control in your component class, the disabled attribute will actually be set in the DOM for\\n      you. We recommend using this approach to avoid 'changed after checked' errors.\\n       \\n      Example: \\n      form = new FormGroup({\\n        first: new FormControl({value: 'Nancy', disabled: true}, Validators.required),\\n        last: new FormControl('Drew', Validators.required)\\n      });\\n    \"",
                "timestamp": 1549625844312,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://ssor.airasia.com/sso/v2/authorization?clientId=AA001AP - Failed to load resource: the server responded with a status of 401 ()",
                "timestamp": 1549625848619,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://ssor.airasia.com/sso/v2/authorization?clientId=AA001AP - Failed to load resource: the server responded with a status of 401 ()",
                "timestamp": 1549625849593,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://www.airasia.com/booking/undefined - Failed to load resource: the server responded with a status of 502 ()",
                "timestamp": 1549625850780,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://ssor.airasia.com/sso/v2/authorization?clientId=AA001AP - Failed to load resource: the server responded with a status of 401 ()",
                "timestamp": 1549625853658,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://ssor.airasia.com/sso/v2/authorization?clientId=AA001AP - Failed to load resource: the server responded with a status of 401 ()",
                "timestamp": 1549625854553,
                "type": ""
            }
        ],
        "screenShotFile": "00f40041-009b-004b-00d1-00b100b700c1.png",
        "timestamp": 1549625839131,
        "duration": 17151
    },
    {
        "description": "testing for traditiona Chinese|Testing change of language",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 8944,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://ssor.airasia.com/sso/v2/authorization?clientId=AA001AP - Failed to load resource: the server responded with a status of 401 ()",
                "timestamp": 1549625863159,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://ssor.airasia.com/sso/v2/authorization?clientId=AA001AP - Failed to load resource: the server responded with a status of 401 ()",
                "timestamp": 1549625864065,
                "type": ""
            }
        ],
        "screenShotFile": "00860044-0005-00a7-00a7-00b900da0058.png",
        "timestamp": 1549625857555,
        "duration": 8283
    },
    {
        "description": "testing for Indonesian|Testing change of language",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 8944,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://ssor.airasia.com/sso/v2/authorization?clientId=AA001AP - Failed to load resource: the server responded with a status of 401 ()",
                "timestamp": 1549625870957,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://ssor.airasia.com/sso/v2/authorization?clientId=AA001AP - Failed to load resource: the server responded with a status of 401 ()",
                "timestamp": 1549625871787,
                "type": ""
            }
        ],
        "screenShotFile": "00db00d5-00c2-00de-00b7-006c003f0040.png",
        "timestamp": 1549625866814,
        "duration": 6807
    },
    {
        "description": "testing for Malaysian|Testing change of language",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 8944,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://ssor.airasia.com/sso/v2/authorization?clientId=AA001AP - Failed to load resource: the server responded with a status of 401 ()",
                "timestamp": 1549625879381,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://ssor.airasia.com/sso/v2/authorization?clientId=AA001AP - Failed to load resource: the server responded with a status of 401 ()",
                "timestamp": 1549625880218,
                "type": ""
            }
        ],
        "screenShotFile": "007a0032-00f4-0033-0012-00c500350068.png",
        "timestamp": 1549625874749,
        "duration": 7249
    },
    {
        "description": "Searching flights between two cities|Testing for correctness of route",
        "passed": false,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 644,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": [
            "Failed: OriginCity is not defined"
        ],
        "trace": [
            "ReferenceError: OriginCity is not defined\n    at UserContext.<anonymous> (C:\\Users\\mindfire\\Desktop\\ProtractorNew\\Test Cases\\CityCheck.js:20:42)\n    at C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2974:25)\n    at C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/next_tick.js:81:5)\nFrom: Task: Run it(\"Searching flights between two cities\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at shutdownTask_.MicroTask (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\mindfire\\Desktop\\ProtractorNew\\Test Cases\\CityCheck.js:16:5)\n    at addSpecsToSuite (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\mindfire\\Desktop\\ProtractorNew\\Test Cases\\CityCheck.js:12:1)\n    at Module._compile (internal/modules/cjs/loader.js:736:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:747:10)\n    at Module.load (internal/modules/cjs/loader.js:628:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:568:12)"
        ],
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://www.airasia.com/booking/main.50d4b5f1246487990501.js 0 Synchronous XMLHttpRequest on the main thread is deprecated because of its detrimental effects to the end user's experience. For more help, check https://xhr.spec.whatwg.org/.",
                "timestamp": 1549629444148,
                "type": ""
            }
        ],
        "screenShotFile": "007b00e6-00a3-005f-005b-00f300950059.png",
        "timestamp": 1549629441045,
        "duration": 3199
    },
    {
        "description": "Searching flights between two cities|Testing for correctness of route",
        "passed": false,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 8120,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": [
            "Failed: Index out of bound. Trying to access element at index: 0, but there are only 0 elements that match locator By(css selector, #origin-destination-label-desc)"
        ],
        "trace": [
            "NoSuchElementError: Index out of bound. Trying to access element at index: 0, but there are only 0 elements that match locator By(css selector, #origin-destination-label-desc)\n    at selenium_webdriver_1.promise.all.then (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:274:27)\n    at ManagedPromise.invokeCallback_ (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27)\n    at C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/next_tick.js:81:5)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as getText] (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.(anonymous function).args [as getText] (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at UserContext.<anonymous> (C:\\Users\\mindfire\\Desktop\\ProtractorNew\\Test Cases\\CityCheck.js:45:44)\n    at C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as isDisplayed] (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.(anonymous function).args [as isDisplayed] (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at UserContext.<anonymous> (C:\\Users\\mindfire\\Desktop\\ProtractorNew\\Test Cases\\CityCheck.js:45:54)\n    at C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\nFrom: Task: Run it(\"Searching flights between two cities\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at shutdownTask_.MicroTask (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\mindfire\\Desktop\\ProtractorNew\\Test Cases\\CityCheck.js:16:5)\n    at addSpecsToSuite (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\mindfire\\Desktop\\ProtractorNew\\Test Cases\\CityCheck.js:12:1)\n    at Module._compile (internal/modules/cjs/loader.js:736:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:747:10)\n    at Module.load (internal/modules/cjs/loader.js:628:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:568:12)"
        ],
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://www.airasia.com/booking/main.50d4b5f1246487990501.js 0 Synchronous XMLHttpRequest on the main thread is deprecated because of its detrimental effects to the end user's experience. For more help, check https://xhr.spec.whatwg.org/.",
                "timestamp": 1549629568306,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://www.airasia.com/booking/main.50d4b5f1246487990501.js 0:1686501 \"Deprecation warning: moment().add(period, number) is deprecated. Please use moment().add(number, period). See http://momentjs.com/guides/#/warnings/add-inverted-param/ for more info.\"",
                "timestamp": 1549629569315,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://www.airasia.com/booking/main.50d4b5f1246487990501.js 0:1186101 \"\\n      It looks like you're using the disabled attribute with a reactive form directive. If you set disabled to true\\n      when you set up this control in your component class, the disabled attribute will actually be set in the DOM for\\n      you. We recommend using this approach to avoid 'changed after checked' errors.\\n       \\n      Example: \\n      form = new FormGroup({\\n        first: new FormControl({value: 'Nancy', disabled: true}, Validators.required),\\n        last: new FormControl('Drew', Validators.required)\\n      });\\n    \"",
                "timestamp": 1549629569900,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://www.airasia.com/booking/main.50d4b5f1246487990501.js 0:1186101 \"\\n      It looks like you're using the disabled attribute with a reactive form directive. If you set disabled to true\\n      when you set up this control in your component class, the disabled attribute will actually be set in the DOM for\\n      you. We recommend using this approach to avoid 'changed after checked' errors.\\n       \\n      Example: \\n      form = new FormGroup({\\n        first: new FormControl({value: 'Nancy', disabled: true}, Validators.required),\\n        last: new FormControl('Drew', Validators.required)\\n      });\\n    \"",
                "timestamp": 1549629569917,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://ssor.airasia.com/sso/v2/authorization?clientId=AA001AP - Failed to load resource: the server responded with a status of 401 ()",
                "timestamp": 1549629574712,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://www.airasia.com/booking/undefined - Failed to load resource: the server responded with a status of 502 ()",
                "timestamp": 1549629575219,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://ssor.airasia.com/sso/v2/authorization?clientId=AA001AP - Failed to load resource: the server responded with a status of 401 ()",
                "timestamp": 1549629575651,
                "type": ""
            }
        ],
        "screenShotFile": "00080033-0077-0036-00a4-0025003100ee.png",
        "timestamp": 1549629565600,
        "duration": 17758
    },
    {
        "description": "Searching flights between two cities|Testing for correctness of route",
        "passed": false,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 6708,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": [
            "Failed: Index out of bound. Trying to access element at index: 0, but there are only 0 elements that match locator By(css selector, .origin-destination-label)"
        ],
        "trace": [
            "NoSuchElementError: Index out of bound. Trying to access element at index: 0, but there are only 0 elements that match locator By(css selector, .origin-destination-label)\n    at selenium_webdriver_1.promise.all.then (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:274:27)\n    at ManagedPromise.invokeCallback_ (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27)\n    at C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/next_tick.js:81:5)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as getText] (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.(anonymous function).args [as getText] (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at UserContext.<anonymous> (C:\\Users\\mindfire\\Desktop\\ProtractorNew\\Test Cases\\CityCheck.js:45:44)\n    at C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as isDisplayed] (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.(anonymous function).args [as isDisplayed] (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at UserContext.<anonymous> (C:\\Users\\mindfire\\Desktop\\ProtractorNew\\Test Cases\\CityCheck.js:45:54)\n    at C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\nFrom: Task: Run it(\"Searching flights between two cities\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at shutdownTask_.MicroTask (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\mindfire\\Desktop\\ProtractorNew\\Test Cases\\CityCheck.js:16:5)\n    at addSpecsToSuite (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\mindfire\\Desktop\\ProtractorNew\\Test Cases\\CityCheck.js:12:1)\n    at Module._compile (internal/modules/cjs/loader.js:736:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:747:10)\n    at Module.load (internal/modules/cjs/loader.js:628:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:568:12)"
        ],
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://www.airasia.com/booking/main.50d4b5f1246487990501.js 0 Synchronous XMLHttpRequest on the main thread is deprecated because of its detrimental effects to the end user's experience. For more help, check https://xhr.spec.whatwg.org/.",
                "timestamp": 1549629899192,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://www.airasia.com/booking/main.50d4b5f1246487990501.js 0:1686501 \"Deprecation warning: moment().add(period, number) is deprecated. Please use moment().add(number, period). See http://momentjs.com/guides/#/warnings/add-inverted-param/ for more info.\"",
                "timestamp": 1549629900458,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://www.airasia.com/booking/main.50d4b5f1246487990501.js 0:1186101 \"\\n      It looks like you're using the disabled attribute with a reactive form directive. If you set disabled to true\\n      when you set up this control in your component class, the disabled attribute will actually be set in the DOM for\\n      you. We recommend using this approach to avoid 'changed after checked' errors.\\n       \\n      Example: \\n      form = new FormGroup({\\n        first: new FormControl({value: 'Nancy', disabled: true}, Validators.required),\\n        last: new FormControl('Drew', Validators.required)\\n      });\\n    \"",
                "timestamp": 1549629901441,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://www.airasia.com/booking/main.50d4b5f1246487990501.js 0:1186101 \"\\n      It looks like you're using the disabled attribute with a reactive form directive. If you set disabled to true\\n      when you set up this control in your component class, the disabled attribute will actually be set in the DOM for\\n      you. We recommend using this approach to avoid 'changed after checked' errors.\\n       \\n      Example: \\n      form = new FormGroup({\\n        first: new FormControl({value: 'Nancy', disabled: true}, Validators.required),\\n        last: new FormControl('Drew', Validators.required)\\n      });\\n    \"",
                "timestamp": 1549629901470,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://ssor.airasia.com/sso/v2/authorization?clientId=AA001AP - Failed to load resource: the server responded with a status of 401 ()",
                "timestamp": 1549629906773,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://ssor.airasia.com/sso/v2/authorization?clientId=AA001AP - Failed to load resource: the server responded with a status of 401 ()",
                "timestamp": 1549629907434,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://www.airasia.com/booking/undefined - Failed to load resource: the server responded with a status of 502 ()",
                "timestamp": 1549629907537,
                "type": ""
            }
        ],
        "screenShotFile": "004900f1-00d9-0057-008d-000400ed00dd.png",
        "timestamp": 1549629896203,
        "duration": 19047
    },
    {
        "description": "Searching flights between two cities|Testing for correctness of route",
        "passed": false,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 10140,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": [
            "Expected [  ] to equal 'Bhubaneswar to Bengaluru'.",
            "Failed: Index out of bound. Trying to access element at index: 1, but there are only 0 elements that match locator By(xpath, //*[@id=\"origin-destination-label-desc\"])"
        ],
        "trace": [
            "Error: Failed expectation\n    at C:\\Users\\mindfire\\Desktop\\ProtractorNew\\Test Cases\\CityCheck.js:46:53\n    at ManagedPromise.invokeCallback_ (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27)\n    at C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/next_tick.js:81:5)",
            "NoSuchElementError: Index out of bound. Trying to access element at index: 1, but there are only 0 elements that match locator By(xpath, //*[@id=\"origin-destination-label-desc\"])\n    at selenium_webdriver_1.promise.all.then (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:274:27)\n    at ManagedPromise.invokeCallback_ (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27)\n    at C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/next_tick.js:81:5)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as getText] (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.(anonymous function).args [as getText] (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at C:\\Users\\mindfire\\Desktop\\ProtractorNew\\Test Cases\\CityCheck.js:47:42\n    at ManagedPromise.invokeCallback_ (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27)\n    at C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/next_tick.js:81:5)\nFrom: Task: Run it(\"Searching flights between two cities\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at shutdownTask_.MicroTask (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\mindfire\\Desktop\\ProtractorNew\\Test Cases\\CityCheck.js:16:5)\n    at addSpecsToSuite (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\mindfire\\Desktop\\ProtractorNew\\Test Cases\\CityCheck.js:12:1)\n    at Module._compile (internal/modules/cjs/loader.js:736:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:747:10)\n    at Module.load (internal/modules/cjs/loader.js:628:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:568:12)"
        ],
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://www.airasia.com/booking/main.50d4b5f1246487990501.js 0 Synchronous XMLHttpRequest on the main thread is deprecated because of its detrimental effects to the end user's experience. For more help, check https://xhr.spec.whatwg.org/.",
                "timestamp": 1549630112474,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://www.airasia.com/booking/main.50d4b5f1246487990501.js 0:1686501 \"Deprecation warning: moment().add(period, number) is deprecated. Please use moment().add(number, period). See http://momentjs.com/guides/#/warnings/add-inverted-param/ for more info.\"",
                "timestamp": 1549630113752,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://www.airasia.com/booking/main.50d4b5f1246487990501.js 0:1186101 \"\\n      It looks like you're using the disabled attribute with a reactive form directive. If you set disabled to true\\n      when you set up this control in your component class, the disabled attribute will actually be set in the DOM for\\n      you. We recommend using this approach to avoid 'changed after checked' errors.\\n       \\n      Example: \\n      form = new FormGroup({\\n        first: new FormControl({value: 'Nancy', disabled: true}, Validators.required),\\n        last: new FormControl('Drew', Validators.required)\\n      });\\n    \"",
                "timestamp": 1549630114518,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://www.airasia.com/booking/main.50d4b5f1246487990501.js 0:1186101 \"\\n      It looks like you're using the disabled attribute with a reactive form directive. If you set disabled to true\\n      when you set up this control in your component class, the disabled attribute will actually be set in the DOM for\\n      you. We recommend using this approach to avoid 'changed after checked' errors.\\n       \\n      Example: \\n      form = new FormGroup({\\n        first: new FormControl({value: 'Nancy', disabled: true}, Validators.required),\\n        last: new FormControl('Drew', Validators.required)\\n      });\\n    \"",
                "timestamp": 1549630114534,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://ssor.airasia.com/sso/v2/authorization?clientId=AA001AP - Failed to load resource: the server responded with a status of 401 ()",
                "timestamp": 1549630120065,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://www.airasia.com/booking/undefined - Failed to load resource: the server responded with a status of 502 ()",
                "timestamp": 1549630120861,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://ssor.airasia.com/sso/v2/authorization?clientId=AA001AP - Failed to load resource: the server responded with a status of 401 ()",
                "timestamp": 1549630121279,
                "type": ""
            }
        ],
        "screenShotFile": "005300fc-0069-00a7-0028-00a900d500c7.png",
        "timestamp": 1549630108776,
        "duration": 22556
    },
    {
        "description": "Searching flights between two cities|Testing for correctness of route",
        "passed": false,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 4768,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": [
            "Expected [  ] to equal 'Bhubaneswar to Bengaluru'.",
            "Expected [  ] to equal 'Bengaluru to Bhubaneswar'."
        ],
        "trace": [
            "Error: Failed expectation\n    at C:\\Users\\mindfire\\Desktop\\ProtractorNew\\Test Cases\\CityCheck.js:46:53\n    at ManagedPromise.invokeCallback_ (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27)\n    at C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/next_tick.js:81:5)",
            "Error: Failed expectation\n    at C:\\Users\\mindfire\\Desktop\\ProtractorNew\\Test Cases\\CityCheck.js:47:53\n    at ManagedPromise.invokeCallback_ (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27)\n    at C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/next_tick.js:81:5)"
        ],
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://www.airasia.com/booking/main.50d4b5f1246487990501.js 0 Synchronous XMLHttpRequest on the main thread is deprecated because of its detrimental effects to the end user's experience. For more help, check https://xhr.spec.whatwg.org/.",
                "timestamp": 1549630161980,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://www.airasia.com/booking/main.50d4b5f1246487990501.js 0:1686501 \"Deprecation warning: moment().add(period, number) is deprecated. Please use moment().add(number, period). See http://momentjs.com/guides/#/warnings/add-inverted-param/ for more info.\"",
                "timestamp": 1549630163430,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://www.airasia.com/booking/main.50d4b5f1246487990501.js 0:1186101 \"\\n      It looks like you're using the disabled attribute with a reactive form directive. If you set disabled to true\\n      when you set up this control in your component class, the disabled attribute will actually be set in the DOM for\\n      you. We recommend using this approach to avoid 'changed after checked' errors.\\n       \\n      Example: \\n      form = new FormGroup({\\n        first: new FormControl({value: 'Nancy', disabled: true}, Validators.required),\\n        last: new FormControl('Drew', Validators.required)\\n      });\\n    \"",
                "timestamp": 1549630164113,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://www.airasia.com/booking/main.50d4b5f1246487990501.js 0:1186101 \"\\n      It looks like you're using the disabled attribute with a reactive form directive. If you set disabled to true\\n      when you set up this control in your component class, the disabled attribute will actually be set in the DOM for\\n      you. We recommend using this approach to avoid 'changed after checked' errors.\\n       \\n      Example: \\n      form = new FormGroup({\\n        first: new FormControl({value: 'Nancy', disabled: true}, Validators.required),\\n        last: new FormControl('Drew', Validators.required)\\n      });\\n    \"",
                "timestamp": 1549630164131,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://ssor.airasia.com/sso/v2/authorization?clientId=AA001AP - Failed to load resource: the server responded with a status of 401 ()",
                "timestamp": 1549630167738,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://ssor.airasia.com/sso/v2/authorization?clientId=AA001AP - Failed to load resource: the server responded with a status of 401 ()",
                "timestamp": 1549630168408,
                "type": ""
            }
        ],
        "screenShotFile": "001e00a4-0095-0097-009a-003c004100dd.png",
        "timestamp": 1549630157777,
        "duration": 18098
    },
    {
        "description": "Searching flights between two cities|Testing for correctness of route",
        "passed": false,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 3484,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": [
            "Failed: DepartRoute is not defined"
        ],
        "trace": [
            "ReferenceError: DepartRoute is not defined\n    at C:\\Users\\mindfire\\Desktop\\ProtractorNew\\Test Cases\\CityCheck.js:49:25\n    at ManagedPromise.invokeCallback_ (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27)\n    at C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/next_tick.js:81:5)\nFrom: Task: Run it(\"Searching flights between two cities\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at shutdownTask_.MicroTask (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\mindfire\\Desktop\\ProtractorNew\\Test Cases\\CityCheck.js:16:5)\n    at addSpecsToSuite (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\mindfire\\Desktop\\ProtractorNew\\Test Cases\\CityCheck.js:12:1)\n    at Module._compile (internal/modules/cjs/loader.js:736:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:747:10)\n    at Module.load (internal/modules/cjs/loader.js:628:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:568:12)"
        ],
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://www.airasia.com/booking/main.50d4b5f1246487990501.js 0 Synchronous XMLHttpRequest on the main thread is deprecated because of its detrimental effects to the end user's experience. For more help, check https://xhr.spec.whatwg.org/.",
                "timestamp": 1549630361279,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://www.airasia.com/booking/main.50d4b5f1246487990501.js 0:1686501 \"Deprecation warning: moment().add(period, number) is deprecated. Please use moment().add(number, period). See http://momentjs.com/guides/#/warnings/add-inverted-param/ for more info.\"",
                "timestamp": 1549630362782,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://www.airasia.com/booking/main.50d4b5f1246487990501.js 0:1186101 \"\\n      It looks like you're using the disabled attribute with a reactive form directive. If you set disabled to true\\n      when you set up this control in your component class, the disabled attribute will actually be set in the DOM for\\n      you. We recommend using this approach to avoid 'changed after checked' errors.\\n       \\n      Example: \\n      form = new FormGroup({\\n        first: new FormControl({value: 'Nancy', disabled: true}, Validators.required),\\n        last: new FormControl('Drew', Validators.required)\\n      });\\n    \"",
                "timestamp": 1549630363489,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://www.airasia.com/booking/main.50d4b5f1246487990501.js 0:1186101 \"\\n      It looks like you're using the disabled attribute with a reactive form directive. If you set disabled to true\\n      when you set up this control in your component class, the disabled attribute will actually be set in the DOM for\\n      you. We recommend using this approach to avoid 'changed after checked' errors.\\n       \\n      Example: \\n      form = new FormGroup({\\n        first: new FormControl({value: 'Nancy', disabled: true}, Validators.required),\\n        last: new FormControl('Drew', Validators.required)\\n      });\\n    \"",
                "timestamp": 1549630363509,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://ssor.airasia.com/sso/v2/authorization?clientId=AA001AP - Failed to load resource: the server responded with a status of 401 ()",
                "timestamp": 1549630366709,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://ssor.airasia.com/sso/v2/authorization?clientId=AA001AP - Failed to load resource: the server responded with a status of 401 ()",
                "timestamp": 1549630367458,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://www.airasia.com/booking/undefined - Failed to load resource: the server responded with a status of 502 ()",
                "timestamp": 1549630368433,
                "type": ""
            }
        ],
        "screenShotFile": "00360094-007c-008b-0093-0083003e0042.png",
        "timestamp": 1549630357878,
        "duration": 18691
    },
    {
        "description": "Searching flights between two cities|Testing for correctness of route",
        "passed": false,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 7540,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": [
            "Failed: CheckCity is not defined"
        ],
        "trace": [
            "ReferenceError: CheckCity is not defined\n    at C:\\Users\\mindfire\\Desktop\\ProtractorNew\\Test Cases\\CityCheck.js:49:25\n    at ManagedPromise.invokeCallback_ (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27)\n    at C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/next_tick.js:81:5)\nFrom: Task: Run it(\"Searching flights between two cities\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at shutdownTask_.MicroTask (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\mindfire\\Desktop\\ProtractorNew\\Test Cases\\CityCheck.js:16:5)\n    at addSpecsToSuite (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\mindfire\\Desktop\\ProtractorNew\\Test Cases\\CityCheck.js:12:1)\n    at Module._compile (internal/modules/cjs/loader.js:736:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:747:10)\n    at Module.load (internal/modules/cjs/loader.js:628:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:568:12)"
        ],
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://www.airasia.com/booking/main.50d4b5f1246487990501.js 0 Synchronous XMLHttpRequest on the main thread is deprecated because of its detrimental effects to the end user's experience. For more help, check https://xhr.spec.whatwg.org/.",
                "timestamp": 1549630416875,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://www.airasia.com/booking/main.50d4b5f1246487990501.js 0:1686501 \"Deprecation warning: moment().add(period, number) is deprecated. Please use moment().add(number, period). See http://momentjs.com/guides/#/warnings/add-inverted-param/ for more info.\"",
                "timestamp": 1549630418388,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://www.airasia.com/booking/main.50d4b5f1246487990501.js 0:1186101 \"\\n      It looks like you're using the disabled attribute with a reactive form directive. If you set disabled to true\\n      when you set up this control in your component class, the disabled attribute will actually be set in the DOM for\\n      you. We recommend using this approach to avoid 'changed after checked' errors.\\n       \\n      Example: \\n      form = new FormGroup({\\n        first: new FormControl({value: 'Nancy', disabled: true}, Validators.required),\\n        last: new FormControl('Drew', Validators.required)\\n      });\\n    \"",
                "timestamp": 1549630419273,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://www.airasia.com/booking/main.50d4b5f1246487990501.js 0:1186101 \"\\n      It looks like you're using the disabled attribute with a reactive form directive. If you set disabled to true\\n      when you set up this control in your component class, the disabled attribute will actually be set in the DOM for\\n      you. We recommend using this approach to avoid 'changed after checked' errors.\\n       \\n      Example: \\n      form = new FormGroup({\\n        first: new FormControl({value: 'Nancy', disabled: true}, Validators.required),\\n        last: new FormControl('Drew', Validators.required)\\n      });\\n    \"",
                "timestamp": 1549630419301,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://ssor.airasia.com/sso/v2/authorization?clientId=AA001AP - Failed to load resource: the server responded with a status of 401 ()",
                "timestamp": 1549630423318,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://ssor.airasia.com/sso/v2/authorization?clientId=AA001AP - Failed to load resource: the server responded with a status of 401 ()",
                "timestamp": 1549630424803,
                "type": ""
            }
        ],
        "screenShotFile": "006b0002-0077-0062-00d1-0068003500d1.png",
        "timestamp": 1549630413388,
        "duration": 21897
    },
    {
        "description": "Searching flights between two cities|Testing for correctness of route",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 7388,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://www.airasia.com/booking/main.50d4b5f1246487990501.js 0 Synchronous XMLHttpRequest on the main thread is deprecated because of its detrimental effects to the end user's experience. For more help, check https://xhr.spec.whatwg.org/.",
                "timestamp": 1549630491327,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://www.airasia.com/booking/main.50d4b5f1246487990501.js 0:1686501 \"Deprecation warning: moment().add(period, number) is deprecated. Please use moment().add(number, period). See http://momentjs.com/guides/#/warnings/add-inverted-param/ for more info.\"",
                "timestamp": 1549630492611,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://www.airasia.com/booking/main.50d4b5f1246487990501.js 0:1186101 \"\\n      It looks like you're using the disabled attribute with a reactive form directive. If you set disabled to true\\n      when you set up this control in your component class, the disabled attribute will actually be set in the DOM for\\n      you. We recommend using this approach to avoid 'changed after checked' errors.\\n       \\n      Example: \\n      form = new FormGroup({\\n        first: new FormControl({value: 'Nancy', disabled: true}, Validators.required),\\n        last: new FormControl('Drew', Validators.required)\\n      });\\n    \"",
                "timestamp": 1549630493539,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://www.airasia.com/booking/main.50d4b5f1246487990501.js 0:1186101 \"\\n      It looks like you're using the disabled attribute with a reactive form directive. If you set disabled to true\\n      when you set up this control in your component class, the disabled attribute will actually be set in the DOM for\\n      you. We recommend using this approach to avoid 'changed after checked' errors.\\n       \\n      Example: \\n      form = new FormGroup({\\n        first: new FormControl({value: 'Nancy', disabled: true}, Validators.required),\\n        last: new FormControl('Drew', Validators.required)\\n      });\\n    \"",
                "timestamp": 1549630493566,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://ssor.airasia.com/sso/v2/authorization?clientId=AA001AP - Failed to load resource: the server responded with a status of 401 ()",
                "timestamp": 1549630498863,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://ssor.airasia.com/sso/v2/authorization?clientId=AA001AP - Failed to load resource: the server responded with a status of 401 ()",
                "timestamp": 1549630499610,
                "type": ""
            }
        ],
        "screenShotFile": "00cf00d7-00d0-0009-0086-000700100034.png",
        "timestamp": 1549630487847,
        "duration": 22836
    },
    {
        "description": "Searching flights between two cities|Testing for correctness of route",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 7708,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://www.airasia.com/booking/main.50d4b5f1246487990501.js 0 Synchronous XMLHttpRequest on the main thread is deprecated because of its detrimental effects to the end user's experience. For more help, check https://xhr.spec.whatwg.org/.",
                "timestamp": 1549630549868,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://www.airasia.com/booking/main.50d4b5f1246487990501.js 0:1686501 \"Deprecation warning: moment().add(period, number) is deprecated. Please use moment().add(number, period). See http://momentjs.com/guides/#/warnings/add-inverted-param/ for more info.\"",
                "timestamp": 1549630552311,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://www.airasia.com/booking/main.50d4b5f1246487990501.js 0:1186101 \"\\n      It looks like you're using the disabled attribute with a reactive form directive. If you set disabled to true\\n      when you set up this control in your component class, the disabled attribute will actually be set in the DOM for\\n      you. We recommend using this approach to avoid 'changed after checked' errors.\\n       \\n      Example: \\n      form = new FormGroup({\\n        first: new FormControl({value: 'Nancy', disabled: true}, Validators.required),\\n        last: new FormControl('Drew', Validators.required)\\n      });\\n    \"",
                "timestamp": 1549630552893,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://www.airasia.com/booking/main.50d4b5f1246487990501.js 0:1186101 \"\\n      It looks like you're using the disabled attribute with a reactive form directive. If you set disabled to true\\n      when you set up this control in your component class, the disabled attribute will actually be set in the DOM for\\n      you. We recommend using this approach to avoid 'changed after checked' errors.\\n       \\n      Example: \\n      form = new FormGroup({\\n        first: new FormControl({value: 'Nancy', disabled: true}, Validators.required),\\n        last: new FormControl('Drew', Validators.required)\\n      });\\n    \"",
                "timestamp": 1549630552907,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://ssor.airasia.com/sso/v2/authorization?clientId=AA001AP - Failed to load resource: the server responded with a status of 401 ()",
                "timestamp": 1549630555030,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://ssor.airasia.com/sso/v2/authorization?clientId=AA001AP - Failed to load resource: the server responded with a status of 401 ()",
                "timestamp": 1549630555731,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://www.airasia.com/booking/undefined - Failed to load resource: the server responded with a status of 502 ()",
                "timestamp": 1549630556937,
                "type": ""
            }
        ],
        "screenShotFile": "00ca0005-00bc-0035-0025-00fb00400054.png",
        "timestamp": 1549630542723,
        "duration": 21883
    },
    {
        "description": "Searching flights between two cities|Testing for correctness of route",
        "passed": false,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 7196,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": [
            "Expected [  ] to equal 'Bhubaneswar to Bengaluru'.",
            "Expected [  ] to equal 'Bengaluru to Bhubaneswar'."
        ],
        "trace": [
            "Error: Failed expectation\n    at C:\\Users\\mindfire\\Desktop\\ProtractorNew\\Test Cases\\CityCheck.js:46:53\n    at ManagedPromise.invokeCallback_ (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27)\n    at C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/next_tick.js:81:5)",
            "Error: Failed expectation\n    at C:\\Users\\mindfire\\Desktop\\ProtractorNew\\Test Cases\\CityCheck.js:47:53\n    at ManagedPromise.invokeCallback_ (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27)\n    at C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/next_tick.js:81:5)"
        ],
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://www.airasia.com/booking/main.50d4b5f1246487990501.js 0 Synchronous XMLHttpRequest on the main thread is deprecated because of its detrimental effects to the end user's experience. For more help, check https://xhr.spec.whatwg.org/.",
                "timestamp": 1549630618073,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://www.airasia.com/booking/main.50d4b5f1246487990501.js 0:1686501 \"Deprecation warning: moment().add(period, number) is deprecated. Please use moment().add(number, period). See http://momentjs.com/guides/#/warnings/add-inverted-param/ for more info.\"",
                "timestamp": 1549630619180,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://www.airasia.com/booking/main.50d4b5f1246487990501.js 0:1186101 \"\\n      It looks like you're using the disabled attribute with a reactive form directive. If you set disabled to true\\n      when you set up this control in your component class, the disabled attribute will actually be set in the DOM for\\n      you. We recommend using this approach to avoid 'changed after checked' errors.\\n       \\n      Example: \\n      form = new FormGroup({\\n        first: new FormControl({value: 'Nancy', disabled: true}, Validators.required),\\n        last: new FormControl('Drew', Validators.required)\\n      });\\n    \"",
                "timestamp": 1549630619991,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://www.airasia.com/booking/main.50d4b5f1246487990501.js 0:1186101 \"\\n      It looks like you're using the disabled attribute with a reactive form directive. If you set disabled to true\\n      when you set up this control in your component class, the disabled attribute will actually be set in the DOM for\\n      you. We recommend using this approach to avoid 'changed after checked' errors.\\n       \\n      Example: \\n      form = new FormGroup({\\n        first: new FormControl({value: 'Nancy', disabled: true}, Validators.required),\\n        last: new FormControl('Drew', Validators.required)\\n      });\\n    \"",
                "timestamp": 1549630620013,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://ssor.airasia.com/sso/v2/authorization?clientId=AA001AP - Failed to load resource: the server responded with a status of 401 ()",
                "timestamp": 1549630624871,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://ssor.airasia.com/sso/v2/authorization?clientId=AA001AP - Failed to load resource: the server responded with a status of 401 ()",
                "timestamp": 1549630625795,
                "type": ""
            }
        ],
        "screenShotFile": "00260040-00fd-0076-0067-0027000f00a7.png",
        "timestamp": 1549630614601,
        "duration": 22869
    },
    {
        "description": "Searching flights between two cities|Testing for correctness of route",
        "passed": false,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 7644,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": [
            "Expected [  ] to equal 'Bhubaneswar to Bengaluru'.",
            "Expected [  ] to equal 'Bengaluru to Bhubaneswar'."
        ],
        "trace": [
            "Error: Failed expectation\n    at C:\\Users\\mindfire\\Desktop\\ProtractorNew\\Test Cases\\CityCheck.js:46:43\n    at ManagedPromise.invokeCallback_ (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27)\n    at C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/next_tick.js:81:5)",
            "Error: Failed expectation\n    at C:\\Users\\mindfire\\Desktop\\ProtractorNew\\Test Cases\\CityCheck.js:47:43\n    at ManagedPromise.invokeCallback_ (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27)\n    at C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/next_tick.js:81:5)"
        ],
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://www.airasia.com/booking/main.50d4b5f1246487990501.js 0 Synchronous XMLHttpRequest on the main thread is deprecated because of its detrimental effects to the end user's experience. For more help, check https://xhr.spec.whatwg.org/.",
                "timestamp": 1549630701579,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://www.airasia.com/booking/main.50d4b5f1246487990501.js 0:1686501 \"Deprecation warning: moment().add(period, number) is deprecated. Please use moment().add(number, period). See http://momentjs.com/guides/#/warnings/add-inverted-param/ for more info.\"",
                "timestamp": 1549630702484,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://www.airasia.com/booking/main.50d4b5f1246487990501.js 0:1186101 \"\\n      It looks like you're using the disabled attribute with a reactive form directive. If you set disabled to true\\n      when you set up this control in your component class, the disabled attribute will actually be set in the DOM for\\n      you. We recommend using this approach to avoid 'changed after checked' errors.\\n       \\n      Example: \\n      form = new FormGroup({\\n        first: new FormControl({value: 'Nancy', disabled: true}, Validators.required),\\n        last: new FormControl('Drew', Validators.required)\\n      });\\n    \"",
                "timestamp": 1549630703144,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://www.airasia.com/booking/main.50d4b5f1246487990501.js 0:1186101 \"\\n      It looks like you're using the disabled attribute with a reactive form directive. If you set disabled to true\\n      when you set up this control in your component class, the disabled attribute will actually be set in the DOM for\\n      you. We recommend using this approach to avoid 'changed after checked' errors.\\n       \\n      Example: \\n      form = new FormGroup({\\n        first: new FormControl({value: 'Nancy', disabled: true}, Validators.required),\\n        last: new FormControl('Drew', Validators.required)\\n      });\\n    \"",
                "timestamp": 1549630703168,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://ssor.airasia.com/sso/v2/authorization?clientId=AA001AP - Failed to load resource: the server responded with a status of 401 ()",
                "timestamp": 1549630708068,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://www.airasia.com/booking/undefined - Failed to load resource: the server responded with a status of 502 ()",
                "timestamp": 1549630708644,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://ssor.airasia.com/sso/v2/authorization?clientId=AA001AP - Failed to load resource: the server responded with a status of 401 ()",
                "timestamp": 1549630708990,
                "type": ""
            }
        ],
        "screenShotFile": "009000a3-0066-0050-00ec-00f2008600ca.png",
        "timestamp": 1549630698667,
        "duration": 16578
    },
    {
        "description": "Searching flights between two cities|Testing for correctness of route",
        "passed": false,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 7368,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": [
            "Failed: Index out of bound. Trying to access element at index: 0, but there are only 0 elements that match locator By(css selector, .origin-destination-label #origin-destination-label-desc)"
        ],
        "trace": [
            "NoSuchElementError: Index out of bound. Trying to access element at index: 0, but there are only 0 elements that match locator By(css selector, .origin-destination-label #origin-destination-label-desc)\n    at selenium_webdriver_1.promise.all.then (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:274:27)\n    at ManagedPromise.invokeCallback_ (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at asyncRun (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27)\n    at C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/next_tick.js:81:5)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as isDisplayed] (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.(anonymous function).args [as isDisplayed] (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at UserContext.<anonymous> (C:\\Users\\mindfire\\Desktop\\ProtractorNew\\Test Cases\\CityCheck.js:45:44)\n    at C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\nFrom: Task: Run it(\"Searching flights between two cities\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at shutdownTask_.MicroTask (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\mindfire\\Desktop\\ProtractorNew\\Test Cases\\CityCheck.js:16:5)\n    at addSpecsToSuite (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\mindfire\\Desktop\\ProtractorNew\\Test Cases\\CityCheck.js:12:1)\n    at Module._compile (internal/modules/cjs/loader.js:736:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:747:10)\n    at Module.load (internal/modules/cjs/loader.js:628:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:568:12)"
        ],
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://www.airasia.com/booking/main.7ed1eefe20843c0ae635.js 0 Synchronous XMLHttpRequest on the main thread is deprecated because of its detrimental effects to the end user's experience. For more help, check https://xhr.spec.whatwg.org/.",
                "timestamp": 1549630933259,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://www.airasia.com/booking/main.7ed1eefe20843c0ae635.js 0:1686500 \"Deprecation warning: moment().add(period, number) is deprecated. Please use moment().add(number, period). See http://momentjs.com/guides/#/warnings/add-inverted-param/ for more info.\"",
                "timestamp": 1549630934705,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://www.airasia.com/booking/main.7ed1eefe20843c0ae635.js 0:1186100 \"\\n      It looks like you're using the disabled attribute with a reactive form directive. If you set disabled to true\\n      when you set up this control in your component class, the disabled attribute will actually be set in the DOM for\\n      you. We recommend using this approach to avoid 'changed after checked' errors.\\n       \\n      Example: \\n      form = new FormGroup({\\n        first: new FormControl({value: 'Nancy', disabled: true}, Validators.required),\\n        last: new FormControl('Drew', Validators.required)\\n      });\\n    \"",
                "timestamp": 1549630935460,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://www.airasia.com/booking/main.7ed1eefe20843c0ae635.js 0:1186100 \"\\n      It looks like you're using the disabled attribute with a reactive form directive. If you set disabled to true\\n      when you set up this control in your component class, the disabled attribute will actually be set in the DOM for\\n      you. We recommend using this approach to avoid 'changed after checked' errors.\\n       \\n      Example: \\n      form = new FormGroup({\\n        first: new FormControl({value: 'Nancy', disabled: true}, Validators.required),\\n        last: new FormControl('Drew', Validators.required)\\n      });\\n    \"",
                "timestamp": 1549630935476,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://ssor.airasia.com/sso/v2/authorization?clientId=AA001AP - Failed to load resource: the server responded with a status of 401 ()",
                "timestamp": 1549630939981,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://ssor.airasia.com/sso/v2/authorization?clientId=AA001AP - Failed to load resource: the server responded with a status of 401 ()",
                "timestamp": 1549630941005,
                "type": ""
            }
        ],
        "screenShotFile": "00810026-003b-002a-00b9-009e006c00fd.png",
        "timestamp": 1549630928408,
        "duration": 17605
    }
];

    this.sortSpecs = function () {
        this.results = results.sort(function sortFunction(a, b) {
    if (a.sessionId < b.sessionId) return -1;else if (a.sessionId > b.sessionId) return 1;

    if (a.timestamp < b.timestamp) return -1;else if (a.timestamp > b.timestamp) return 1;

    return 0;
});
    };

    this.loadResultsViaAjax = function () {

        $http({
            url: './combined.json',
            method: 'GET'
        }).then(function (response) {
                var data = null;
                if (response && response.data) {
                    if (typeof response.data === 'object') {
                        data = response.data;
                    } else if (response.data[0] === '"') { //detect super escaped file (from circular json)
                        data = CircularJSON.parse(response.data); //the file is escaped in a weird way (with circular json)
                    }
                    else
                    {
                        data = JSON.parse(response.data);
                    }
                }
                if (data) {
                    results = data;
                    that.sortSpecs();
                }
            },
            function (error) {
                console.error(error);
            });
    };


    if (clientDefaults.useAjax) {
        this.loadResultsViaAjax();
    } else {
        this.sortSpecs();
    }


});

app.filter('bySearchSettings', function () {
    return function (items, searchSettings) {
        var filtered = [];
        if (!items) {
            return filtered; // to avoid crashing in where results might be empty
        }
        var prevItem = null;

        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            item.displaySpecName = false;

            var isHit = false; //is set to true if any of the search criteria matched
            countLogMessages(item); // modifies item contents

            var hasLog = searchSettings.withLog && item.browserLogs && item.browserLogs.length > 0;
            if (searchSettings.description === '' ||
                (item.description && item.description.toLowerCase().indexOf(searchSettings.description.toLowerCase()) > -1)) {

                if (searchSettings.passed && item.passed || hasLog) {
                    isHit = true;
                } else if (searchSettings.failed && !item.passed && !item.pending || hasLog) {
                    isHit = true;
                } else if (searchSettings.pending && item.pending || hasLog) {
                    isHit = true;
                }
            }
            if (isHit) {
                checkIfShouldDisplaySpecName(prevItem, item);

                filtered.push(item);
                prevItem = item;
            }
        }

        return filtered;
    };
});
