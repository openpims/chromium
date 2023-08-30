// Saves options to chrome.storage
const saveOptions = () => {
    const url = document.getElementById('url').value;

    chrome.storage.sync.set(
        { openPimsUrl: url },
        () => {
            // Update status to let user know options were saved.
            const status = document.getElementById('status');
            status.textContent = 'Url saved.';
            setTimeout(() => {
                status.textContent = '';
            }, 750);
        }
    );

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
};

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
const restoreOptions = () => {
    chrome.storage.sync.get(
        { openPimsUrl: '' },
        (items) => {
            document.getElementById('url').value = items.openPimsUrl;
        }
    );
};

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);