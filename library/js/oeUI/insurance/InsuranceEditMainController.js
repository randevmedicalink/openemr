/**
 * This class is the main controller for the patient insurance policy edit screen.
 * It coordinates the instantiation of the edit screen and the new policy screen.
 *
 * @package   OpenEMR
 * @link      http://www.open-emr.org
 * @author    Stephen Nielson <snielson@discoverandchange.com>
 * @copyright Copyright (c) 2024 Discover and Change, Inc. <snielson@discoverandchange.com>
 * @license   https://github.com/openemr/openemr/blob/master/LICENSE GNU General Public License 3
 */
import { EditPolicyScreenController } from "./EditPolicyScreenController.js";
import { NewPolicyScreenController } from "./NewPolicyScreenController.js";
import { InsurancePolicyService } from "./InsurancePolicyService.js";
export class InsuranceEditMainController {
    currentScreen = null;

    /**
     *
     * @type EditPolicyScreenController
     * @private
     */
    __editPolicyScreen = null;

    /**
     *
     * @type NewPolicyScreenController
     * @private
     */
    __newPolicyScreen = null;

    /**
     *
     * @type InsurancePolicyService
     * @private
     */
    __insurancePolicyService = null;

    constructor(csrfToken, apiURL, insuranceProviderList, types, puuid) {
        this.__insurancePolicyService = new InsurancePolicyService(csrfToken, apiURL, insuranceProviderList, types, puuid);
    }

    init() {
        this.__insurancePolicyService.loadInsurancesByType()
        .then(() => {
            this.turnOffLoading();
            this.setupControlButtons();
            this.setupEditScreen();
            // this.setupNewPolicyScreen()
        })
        .catch(error => {
            // TODO: @adunsulag what to do here if we fail?
            console.error(error);
        });
    }

    turnOffLoading() {
        let loading = document.querySelector(".container-loading");
        loading.classList.add("d-none");
        let loadedContainer = document.querySelector(".container-loaded");
        loadedContainer.classList.remove("d-none");
    }

    setupEditScreen() {
        this.__editPolicyScreen = new EditPolicyScreenController(this.__insurancePolicyService);
        this.__editPolicyScreen.setup();
        this.currentScreen = this.__editPolicyScreen;
        this.toggleScreenControlButtons(true);
    }

    hideEditScreen() {
        this.__editPolicyScreen.hide();
    }
    showEditScreen() {
        this.__editPolicyScreen.show();
        this.currentScreen = this.__editPolicyScreen;
        this.toggleScreenControlButtons(true);
    }

    setupControlButtons() {
        let btnAddPolicy = document.querySelector(".btn-add-policy");
        btnAddPolicy.addEventListener("click", () => {
            this.__editPolicyScreen.hide();
            this.setupNewPolicyScreen();
        });
        let btnEditReturn = document.querySelector(".btn-edit-return");
        btnEditReturn.addEventListener("click", () => {
            this.__newPolicyScreen.destroy();
            this.__newPolicyScreen = null;
            this.showEditScreen();
        });
    }

    toggleScreenControlButtons(inEdit) {
        let btnAddPolicy = document.querySelector(".btn-add-policy");
        let btnEditReturn = document.querySelector(".btn-edit-return");
        if (inEdit) {
            btnAddPolicy.classList.remove("d-none");
            btnEditReturn.classList.add("d-none");
        } else {
            btnAddPolicy.classList.add("d-none");
            btnEditReturn.classList.remove("d-none");
        }
    }

    setupNewPolicyScreen() {
        this.__newPolicyScreen = new NewPolicyScreenController(this.__insurancePolicyService);
        //we will pass in a callback to the new policy screen to call when the user clicks next
        // the callback will receive the new data and then we will call the edit screen
        // if we are updating the last policy effective date we need to update that policy and then call the edit screen
        this.__newPolicyScreen.setup(this.handleNewPolicyScreenNext.bind(this));
        this.currentScreen = this.__newPolicyScreen;
        this.toggleScreenControlButtons(false);
    }

    handleNewPolicyScreenNext(newPolicyData) {
        this.__newPolicyScreen.destroy();
        this.__newPolicyScreen = null;
        this.__editPolicyScreen.setupNewPolicyEdit(newPolicyData);
        this.showEditScreen();
    }
}