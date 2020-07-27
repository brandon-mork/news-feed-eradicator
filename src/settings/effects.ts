import { Effect } from '../lib/redux-effects';
import { SettingsState } from './reducer';
import { SettingsActionObject, SettingsActionType } from './action-types';
import { getBrowser, Port } from '../webextension';
import { Message, MessageType } from '../messaging/types';
import { Settings } from '.';

type SettingsEffect = Effect<SettingsState, SettingsActionObject>;

const getSettings = (state: SettingsState): Settings.T => ({
	version: 1,
	showQuotes: state.showQuotes,
	builtinQuotesEnabled: state.builtinQuotesEnabled,
	featureIncrement: state.featureIncrement,
	hiddenBuiltinQuotes: state.hiddenBuiltinQuotes,
	customQuotes: state.customQuotes,
});

/**
 * Listen for content scripts
 */
const listen: SettingsEffect = store => {
	let pages: Port[] = [];
	getBrowser().runtime.onConnect.addListener(port => {
		pages.push(port);

		// Send the new client the latest settings
		const settings: Settings.T = getSettings(store.getState());
		port.postMessage({ t: MessageType.SETTINGS_CHANGED, settings });

		// Remove the port when it closes
		port.onDisconnect.addListener(
			() => (pages = pages.filter(p => p !== port))
		);
		port.onMessage.addListener((msg: Message) => {
			if (msg.t === MessageType.SETTINGS_ACTION) {
				console.log('got an action from a client');
				store.dispatch(msg.action);
			}
		});
	});

	console.log('Listening');

	// Then, after every store action we save the settings and
	// let all the clients know the new settings
	return () => {
		const settings: Settings.T = getSettings(store.getState());
		Settings.save(settings);
		pages.forEach(port =>
			port.postMessage({ t: MessageType.SETTINGS_CHANGED, settings })
		);
	};
};

const loadSettings: SettingsEffect = store => action => {
	if (action.type === SettingsActionType.SETTINGS_LOAD) {
		Settings.load().then(settings => {
			store.dispatch({ type: SettingsActionType.SETTINGS_LOADED, settings });
		});
	}
};

export const rootEffect = Effect.all(listen, loadSettings);