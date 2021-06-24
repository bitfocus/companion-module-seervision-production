import InstanceSkel = require('../../../instance_skel');
import Api from './api';
import * as elements from './elements';

import * as instanceSkelTypes from '../../../instance_skel_types';
import * as types from './types';
import * as containerTypes from './api/ContainersManager';
import * as trackingTypes from './api/TrackingManager';

class SeervisionInstance extends InstanceSkel<types.Config> {
  #api: Api | null;

  constructor(system: instanceSkelTypes.CompanionSystem, id: string, config: types.Config) {
    super(system, id, config);

    this.#api = null;
    this.initConnection();
  }

  config_fields(): instanceSkelTypes.CompanionInputFieldTextInput[] {
    return [
      {
        type: 'textinput',
        id: 'host',
        label: 'IP Address',
        default: '10.10.12.101',
        regex: this.REGEX_IP,
      },
    ];
  }

  destroy(): void {
    this.#api?.closeConnection();
  }

  init(): void {
    this.initElements();
    this.initConnection();
  }

  initConnection(): void {
    this.#api = new Api(this.config.host, this.onConnectionUpdate);
    this.#api.init();

    const feedbacks = elements.getFeedbacks(this.#api, this);
    this.setFeedbackDefinitions(feedbacks);
  }

  initElements(): void {
    if (!this.#api) {
      this.setActions({});
      this.setPresetDefinitions([]);
      return;
    }

    const actions = elements.getActions(this.#api);
    const presets = elements.getPresets(this.#api, this);

    this.setActions(actions);
    this.setPresetDefinitions(presets);
  }

  onConnectionUpdate = (): void => {
    this.initElements();
    this.checkFeedbacks();
  };

  action(action: instanceSkelTypes.CompanionActionEvent): void {
    const options = action.options;

    switch (action.action) {
      case 'recall_container':
        this.#api?.containersManager.recallContainer(options.containerId?.toString() ?? '');
        break;
      case 'create_container':
        this.#api?.containersManager.createContainer(
          options.configuration as containerTypes.ContainerConfiguration
        );
        break;
      case 'reset_connection':
        this.resetConnection();
        break;
      case 'start_tracking': {
        const target = options.target as trackingTypes.TrackingTarget;
        this.#api?.trackingManager.startTracking(target);
        break;
      }
      case 'stop_tracking':
        this.#api?.trackingManager.stopTracking();
        break;
      case 'toggle_tracking': {
        const isTracking = this.#api?.trackingManager.isTracking() ?? false;
        if (isTracking) {
          this.#api?.trackingManager.stopTracking();
        } else {
          this.#api?.trackingManager.startTracking(trackingTypes.TrackingTarget.Default);
        }
      }
    }
  }

  updateConfig(config: types.Config): void {
    const didHostChange = this.config.host !== config.host;
    this.config = config;

    if (didHostChange) {
      this.resetConnection();
    }
  }

  resetConnection(): void {
    this.#api?.closeConnection();
    this.initConnection();
  }
}

export = SeervisionInstance;
