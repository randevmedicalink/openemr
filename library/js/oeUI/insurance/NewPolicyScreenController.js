/**
 * New Policy Screen Controller - This is the controller for the patient new policy screen.
 *
 * @package   OpenEMR
 * @link      http://www.open-emr.org
 * @author    Stephen Nielson <snielson@discoverandchange.com>
 * @copyright Copyright (c) 2024 Discover and Change, Inc. <snielson@discoverandchange.com>
 * @license   https://github.com/openemr/openemr/blob/master/LICENSE GNU General Public License 3
 */
import {InsurancePolicyService} from "./InsurancePolicyService.js";

export class NewPolicyScreenController
{
    __types = null;
    __insurancesByType = {};
    __screenName = "new-policy-screen";

    /**
     *
     * @type {boolean}
     * @private
     */
    __isCopyPolicy = false;
    /**
     *
     * @type {null|number}
     * @private
     */
    __copyPolicyId = null;
    /**
     *
     * @type {boolean}
     * @private
     */
    __setEffectiveEndDate = false;

    /**
     *
     * @type {null|string}
     * @private
     */

    __selectedInsuranceType = null;

    /**
     *
     * @type {string}
     * @private
     */
    __effectiveEndDate = (new Date()).toISOString().substring(0, 10); // grab the first 10 digits

    /**
     * @type {InsurancePolicyService}
     * @private
     */
    __insurancePolicyService = null;

    __boundEvents = [];

    /**
     *
     * @param insurancePolicyService InsurancePolicyService
     */
    constructor(insurancePolicyService) {
        this.__insurancePolicyService = insurancePolicyService;
        this.__types = insurancePolicyService.getInsuranceCategories();
        this.__insurancesByType = insurancePolicyService.getInsurancesByType();
        this.__isCopyPolicy = false;
        this.__setEffectiveEndDate = false;
        this.__copyPolicyId = null;
        this.__selectedInsuranceType = this.__types[0];
    }

    setup(nextButtonCallback) {
        this.show();
        // grab the newInsuranceType radio value
        document.querySelectorAll('input[name="newInsuranceType"]').forEach(radio => {
            this.addEvent(radio, 'click', (event) => {
                this.updateInsuranceType(event);
                this.render();
            });
        });

        document.querySelectorAll('input[name="createOption"]').forEach(radio => {
            this.addEvent(radio, 'click', (event) => {
                this.updateCreateOption(event);
                this.render();
            });
        });

        let setEndDateCheckbox =
        document.getElementById("setEndDateCheckbox");
        this.addEvent(setEndDateCheckbox, 'click', (event) => {
            this.toggleEffectiveEndDate(event);
            this.render(event);
        });
        let nextButtonNode = document.querySelector('.btn-new-policy-next');
        this.addEvent(nextButtonNode, 'click', () => {
            this.handleNextButtonPress(nextButtonCallback);
        });

        let effectiveEndDate = document.querySelector(".new-policy-effective-end-date");
        this.addEvent(effectiveEndDate, 'input', (event) => {
            this.__effectiveEndDate = event.target.value.trim(); // TODO: do we want to parse this as a date?
        });
        this.render();
    }

    updateCreateOption() {
        let createOption = document.querySelector('input[name="createOption"]:checked').value;
        if (createOption === 'copy') {
            this.__isCopyPolicy = true;
            this.setCopyPolicyToFirstPolicy();
        } else {
            this.__isCopyPolicy = false;
            this.__copyPolicyId = null;
        }
    }
    setCopyPolicyToFirstPolicy() {
        if (this.__isCopyPolicy) {
            let insurances = this.__insurancesByType[this.__selectedInsuranceType]
                .filter(insurance => insurance.id !== null);
            this.__copyPolicyId = insurances.length > 0 ? insurances[0].id : null;
        } else {
            this.__copyPolicyId = null;
        }
    }

    updateInsuranceType(event) {
        this.__selectedInsuranceType = event.target.value;
        this.setCopyPolicyToFirstPolicy();
    }

    addEvent(node, event, callback) {
        node.addEventListener(event, callback);
        this.__boundEvents.push({node: node, event: event, callback: callback});
    }

    clearEvents() {
        this.__boundEvents.forEach(event => {
            event.node.removeEventListener(event.event, event.callback);
        });
        this.__boundEvents = [];
    }

    handleNextButtonPress(nextButtonCallback) {
        this.updateEffectiveEndDate();
        let data = this.getDataForNewPolicy();
        let newPolicy = this.getNewPolicy(data.copyPolicyId, data.isCopyPolicy, data.type, data.endDate);
        nextButtonCallback(newPolicy);
    }

    getNewPolicy(copyPolicyId, isCopyPolicy, type) {
        if (!isCopyPolicy) {
            copyPolicyId = null;
        }
        return this.__insurancePolicyService.createInMemoryPolicy(type, copyPolicyId);
    }

    toggleSetEffectiveEndDateRow(display) {
        let setEndDateRow = document.querySelectorAll(".new-policy-set-end-date-row");
        if (display) {
            setEndDateRow.forEach(r => r.classList.remove("d-none"));
        } else {
            setEndDateRow.forEach(r => r.classList.add("d-none"));
            // turning it off will also turn off the checklist.
            this.__setEffectiveEndDate = false;
            document.getElementById('setEndDateCheckbox').checked = false;
        }
    }

    shouldDisplayEffectiveEndDate() {
        let insurances = this.__insurancesByType[this.__selectedInsuranceType] || [];
        if (insurances.length) {
            // check if there is any without an end date
            let currentInsurances = insurances.find(i => i.isCurrentPolicy());
            if (currentInsurances) {
                return true;
            }
        }
        return false;
    }

    displayErrorMessage(errorCode) {
        let errorRow = document.querySelector(".new-policy-error-row");
        errorRow.classList.remove("d-none");
        let errorMessage = document.querySelector(".new-policy-error-message-" + errorCode);
        if (errorMessage) {
            errorMessage.classList.remove("d-none");
        } else {
            console.error("Error message does not exist with class name: new-policy-error-message-" + errorCode);
        }
    }

    updateEffectiveEndDate() {
        // grab the effective end date from the form and update the effective end date
        // for the insurance policy
        let endDateInput = document.querySelector(".new-policy-effective-end-date");
        this.__effectiveEndDate = endDateInput.value;
    }

    getDataForNewPolicy() {
        return {
            type: this.__selectedInsuranceType
            ,endDate: this.__effectiveEndDate
            ,setEndDate: this.__setEffectiveEndDate
            ,copyPolicyId: this.__copyPolicyId
            ,isCopyPolicy: this.__isCopyPolicy
        };
    }

    toggleEffectiveEndDate(event) {
        this.__setEffectiveEndDate = event.target.checked;
    }

    render() {
        // set our selected insurance type
        document.getElementById('new-insurance-type-' + this.__selectedInsuranceType).checked = true;
        document.getElementById('setEndDateCheckbox').checked = this.__setEffectiveEndDate;
        let copyPolicyRow = document.querySelector(".new-policy-copy-row");
        if (!this.__isCopyPolicy) {
            document.getElementById('createOptionBlank').checked = true;
            copyPolicyRow.classList.add("d-none");
            // display the blank-policy form
            // using the newInsuranceType.value grab the select with name
        } else {
            document.getElementById('createOptionCopy').checked = true;
            // show the copy policy row
            copyPolicyRow.classList.remove("d-none");
            this.createCopyPolicyDropdown(this.__selectedInsuranceType);

            if (this.__copyPolicyId) {
                // let copyOptionNode = document.querySelector(".new-policy-copy-list option[value='" + this.__copyPolicyId + "']");
                document.querySelector(".new-policy-copy-list").value = this.__copyPolicyId;
            }
        }

        this.toggleSetEffectiveEndDateRow(this.shouldDisplayEffectiveEndDate());


        let effectiveEndDateRows = document.querySelectorAll(".new-policy-effective-end-date-row");
        if (this.__setEffectiveEndDate) {
            effectiveEndDateRows.forEach(r => r.classList.remove("d-none"));
            let effectiveEndDateInput = document.querySelector(".new-policy-effective-end-date");
            effectiveEndDateInput.value = this.__effectiveEndDate;
        } else {
            effectiveEndDateRows.forEach(r => r.classList.add("d-none"));
        }
        let policyCopyName = document.querySelector(".effective-end-date-policy-label");
        if (policyCopyName) {
            let policyName = window.top.xl("Policy Number missing");
            let policy = this.__insurancePolicyService.getInsuranceByPolicyId(this.__copyPolicyId);
            if (policy) {
                policyName = policy.toString();
            }
            policyCopyName.innerText = policyName;
        }

        if (this.isValid()) {
            this.toggleNextButton(true);
        } else {
            this.toggleNextButton(false);
        }
    }

    isValid() {
        let valid = true;
        let errorRow = document.querySelector(".new-policy-error-row");
        errorRow.classList.add("d-none");
        // reset the messages
        document.querySelectorAll('.new-policy-error-message').forEach(error => {
            error.classList.add("d-none");
        });

        if (this.__copyPolicyId == null && this.__isCopyPolicy) {
            this.displayErrorMessage("copy-empty-policy");
            valid = false;
        }
        if (this.__setEffectiveEndDate && this.__effectiveEndDate === "") {
            this.displayErrorMessage("effective-end-date-empty");
            valid = false;
        }
        return valid;
    }

    toggleNextButton(enable) {
        let nextButton = document.querySelector(".btn-new-policy-next");
        if (enable) {
            nextButton.removeAttribute("disabled");
            nextButton.classList.remove("btn-disabled");
        } else {
            nextButton.setAttribute("disabled", "disabled");
            nextButton.classList.add("btn-disabled");
        }
    }

    createCopyPolicyDropdown(newInsuranceType) {
        let insurancesByType = this.__insurancesByType[newInsuranceType] || [];
        let insurances = insurancesByType.filter(insurance => insurance.id !== null);
        let emptyPolicyList = document.querySelector(".new-policy-list-empty");
        let select = document.querySelector(".new-policy-copy-list");

        select.innerHTML = ""; // remove all the children
        if (insurances.length === 0) {
            emptyPolicyList.classList.remove("d-none");
            select.classList.add("d-none");
        } else {
            emptyPolicyList.classList.add("d-none");
            select.classList.remove("d-none");
            insurances.forEach(insurance => {
                let option = document.createElement('option');
                option.value = insurance.id;
                option.innerText = insurance.toString();
                if (insurance.hasOwnProperty('end_date') && insurance.end_date !== null) {
                    option.innerText += " - " + window.top.xl("End Date") + ": " + insurance.end_date;
                }
                if (insurance.id === this.__copyPolicyId) {
                    option.selected = true;
                }
                select.appendChild(option);
            });
        }
    }

    destroy() {
        // reset our radio buttons
        this.hide();
        // cleanup all events and remove the dialog from the screen.  Reload the insurance
        // edit screen.
        this.clearEvents();
    }

    hide() {
        this.toggleDisplay(false);
    }
    show() {
        this.toggleDisplay(true);
    }
    toggleDisplay(display) {
        let policyScreen = document.getElementById(this.__screenName);
        if (display) {
            policyScreen.classList.remove("d-none");
        } else {
            policyScreen.classList.add("d-none");
        }
    }
}