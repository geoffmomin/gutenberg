/**
 * Internal dependencies
 */
import { registerBlock, query } from '../../api';
import Editable from '../../components/tinymce';

const { html, prop } = query;

registerBlock( 'core/tinymce', {
	title: wp.i18n.__( 'TinyMCE' ),

	icon: 'smiley',

	category: 'common',

	attributes: {
		content: html()
	},

	controls: [	],

	edit( { attributes, setAttributes } ) {
		const { content, align } = attributes;
		return (
			<Editable
				className="tinymce"
				tagName="div"
				value={ content }
				onChange={ ( value ) => setAttributes( { content: value } ) }
				style={ align ? { textAlign: align } : null }
			/>
		);
	},

	save( { attributes } ) {
		return (
			attributes.content
		);
	}
} );
