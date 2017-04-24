/**
 * Internal dependencies
 */
import Editable from '../editable';
export default class TinyMCEEditable extends Editable {
	initialize() {
		const config = {
			target: this.node,
			theme: 'inlite',
			skin_url: this.dummySkin(),
			inline: true,
			plugins: 'image table link paste contextmenu textpattern autolink',
			insert_toolbar: 'blockquote  | quickimage quicktable',
			selection_toolbar: 'bold italic | quicklink h2 h3 blockquote',
			paste_data_images: true,
			browser_spellcheck: true,
			entity_encoding: 'raw',
			setup: this.onSetup,
			formats: {
				strikethrough: { inline: 'del' }
			}
		};

		tinymce.init( config );
	}
}
