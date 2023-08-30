!(function () {
    "use strict";

    chrome.storage.sync.get({'openPimsUrl': ''}).then((result) => {
        var url = result.openPimsUrl;
        console.log("openPimsUrl currently is " + url);
        const allResourceTypes = Object.values(chrome.declarativeNetRequest.ResourceType);
        const rules = [
            {
                id: 1,
                priority: 1,
                action: {
                    type: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
                    requestHeaders: [{
                        operation: chrome.declarativeNetRequest.HeaderOperation.SET,
                        header: "x-openpims",
                        value: url
                    }]
                },
                condition: {
                    urlFilter: "*",
                    resourceTypes: allResourceTypes
                },
            },
        ];
        chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: rules.map((rule) => rule.id),
            addRules: rules
        });
    });
})();