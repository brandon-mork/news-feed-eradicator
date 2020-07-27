import { createStore } from './store/index';
import './options.css';
import { init } from 'snabbdom';
import { h } from 'snabbdom/h';
import propsModule from 'snabbdom/modules/props';
import attrsModule from 'snabbdom/modules/attributes';
import eventsModule from 'snabbdom/modules/eventlisteners';
import { toVNode } from 'snabbdom/tovnode';
import InfoPanel from './components/info-panel';
import { ActionType } from './store/action-types';
import { SettingsActionType } from './settings/action-types';

const store = createStore();

export function start(container: Node | null) {
	if (container == null) {
		throw new Error('Root element not found');
	}

	var nfeContainer = document.createElement('div');
	nfeContainer.id = 'nfe-container';
	container.appendChild(nfeContainer);

	const patch = init([propsModule, attrsModule, eventsModule]);

	let vnode = toVNode(nfeContainer);

	store.dispatch({
		type: ActionType.SETTINGS_ACTION,
		action: {
			type: SettingsActionType.FEATURE_INCREMENT,
		},
	});

	const render = () => {
		const newVnode = h('div#nfe-container', [InfoPanel(store)]);

		patch(vnode, newVnode);
		vnode = newVnode;
	};
	store.subscribe(render);

	render();
}

start(document.getElementById('app'));
