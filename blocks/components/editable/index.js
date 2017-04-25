/**
 * External dependencies
 */
import classnames from 'classnames';
import { last } from 'lodash';
import { Parser as HtmlToReactParser } from 'html-to-react';
import { Fill } from 'react-slot-fill';

/**
 * Internal dependencies
 */
import './style.scss';

 // TODO: We mustn't import by relative path traversing from blocks to editor
 // as we're doing here; instead, we should consider a common components path.
import Toolbar from '../../../editor/components/toolbar';

const htmlToReactParser = new HtmlToReactParser();
const formatMap = {
	strong: 'bold',
	em: 'italic',
	del: 'strikethrough'
};

const formattingControls = [
	{
		icon: 'editor-bold',
		title: wp.i18n.__( 'Bold' ),
		format: 'bold'
	},
	{
		icon: 'editor-italic',
		title: wp.i18n.__( 'Italic' ),
		format: 'italic'
	},
	{
		icon: 'editor-strikethrough',
		title: wp.i18n.__( 'Strikethrough' ),
		format: 'strikethrough'
	}
];

export default class Editable extends wp.element.Component {
	constructor() {
		super( ...arguments );

		this.onInit = this.onInit.bind( this );
		this.onSetup = this.onSetup.bind( this );
		this.onChange = this.onChange.bind( this );
		this.onNewBlock = this.onNewBlock.bind( this );
		this.bindNode = this.bindNode.bind( this );
		this.onFocus = this.onFocus.bind( this );
		this.onFocusOut = this.onFocusOut.bind( this );
		this.onNodeChange = this.onNodeChange.bind( this );

		this.formats = {};
		this.nodes = {};

		this.state = {
			isFocused: false,
			formats: {}
		};
	}

	componentDidMount() {
		this.initialize();
	}

	initialize() {
		const config = {
			target: this.nodes.editor,
			theme: false,
			inline: true,
			toolbar: false,
			browser_spellcheck: true,
			entity_encoding: 'raw',
			setup: this.onSetup,
			formats: {
				strikethrough: { inline: 'del' }
			}
		};

		tinymce.init( config );
	}

	onSetup( editor ) {
		this.editor = editor;
		editor.on( 'init', this.onInit );
		editor.on( 'focusout', this.onFocusOut );
		editor.on( 'NewBlock', this.onNewBlock );
		editor.on( 'focusin', this.onFocus );
		editor.on( 'nodechange', this.onNodeChange );
	}

	onInit() {
		this.setContent( this.props.value );
		this.focus();
	}

	onFocus() {
		if ( ! this.props.onFocus ) {
			return;
		}

		// TODO: We need a way to save the focus position ( bookmark maybe )
		this.props.onFocus();

		this.setState( {
			isFocused: true
		} );
	}

	onFocusOut( event ) {
		this.onChange();

		// Disable reason: In this case we explicitly want to test that the DOM
		// node to which focus is being transfered is not the rendered element.

		/* eslint-disable react/no-find-dom-node */
		const { toolbar } = this.nodes;
		if ( toolbar && wp.element.findDOMNode( toolbar ).contains( event.relatedTarget ) ) {
			event.preventDefault();
			return;
		}
		/* eslint-enable react/no-find-dom-node */

		this.setState( {
			isFocused: false
		} );
	}

	onChange() {
		if ( ! this.editor.isDirty() ) {
			return;
		}

		this.editor.save();
		this.props.onChange( this.getContent() );
	}

	onNewBlock() {
		if ( this.props.tagName || ! this.props.onSplit ) {
			return;
		}

		// Getting the content before and after the cursor
		const childNodes = Array.from( this.editor.getBody().childNodes );
		let selectedChild = this.editor.selection.getStart();
		while ( childNodes.indexOf( selectedChild ) === -1 && selectedChild.parentNode ) {
			selectedChild = selectedChild.parentNode;
		}
		const splitIndex = childNodes.indexOf( selectedChild );
		if ( splitIndex === -1 ) {
			return;
		}
		const getHtml = ( nodes ) => nodes.reduce( ( memo, node ) => memo + node.outerHTML, '' );
		const beforeNodes = childNodes.slice( 0, splitIndex );
		const lastNodeBeforeCursor = last( beforeNodes );
		// Avoid splitting on single enter
		if (
			! lastNodeBeforeCursor ||
			beforeNodes.length < 2 ||
			!! lastNodeBeforeCursor.textContent
		) {
			return;
		}
		const before = getHtml( beforeNodes.slice( 0, beforeNodes.length - 1 ) );

		// Splitting into two blocks
		this.setContent( this.props.value );
		const hasAfter = !! childNodes.slice( splitIndex )
			.reduce( ( memo, node ) => memo + node.textContent, '' );

		const after = hasAfter ? getHtml( childNodes.slice( splitIndex ) ) : '';

		// The setTimeout fixes the focus jump to the original block
		setTimeout( () => {
			this.props.onSplit(
				htmlToReactParser.parse( before ),
				htmlToReactParser.parse( after )
			);
		} );
	}

	onNodeChange( { parents } ) {
		const formats = parents.reduce( ( result, node ) => {
			const tag = node.nodeName.toLowerCase();

			if ( formatMap.hasOwnProperty( tag ) ) {
				result[ formatMap[ tag ] ] = true;
			}

			return result;
		}, {} );

		this.setState( { formats } );
	}

	bindNode( name ) {
		return ( ref ) => {
			this.nodes[ name ] = ref;
		};
	}

	updateContent() {
		const bookmark = this.editor.selection.getBookmark( 2, true );
		this.setContent( this.props.value );
		this.editor.selection.moveToBookmark( bookmark );
		// Saving the editor on updates avoid unecessary onChanges calls
		// These calls can make the focus jump
		this.editor.save();
	}

	setContent( content ) {
		if ( ! content ) {
			content = '';
		}

		content = wp.element.renderToString( content );
		this.editor.setContent( content );
	}

	getContent() {
		const content = this.editor.getContent( { format: 'raw' } );

		return htmlToReactParser.parse( content );
	}

	focus() {
		if ( this.props.focus ) {
			this.editor.focus();
		}
	}

	componentWillUpdate( nextProps ) {
		if ( this.editor && this.props.tagName !== nextProps.tagName ) {
			this.editor.destroy();
		}
	}

	componentWillUnmount() {
		if ( this.editor ) {
			this.onChange();
			this.editor.destroy();
		}
	}

	componentDidUpdate( prevProps ) {
		if ( this.props.tagName !== prevProps.tagName ) {
			this.initialize();
		}

		if ( !! this.props.focus && ! prevProps.focus ) {
			this.focus();
		}

		if (
			this.props.tagName === prevProps.tagName &&
			this.props.value !== prevProps.value
		) {
			this.updateContent();
		}
	}

	isFormatActive( format ) {
		return !! this.state.formats[ format ];
	}

	toggleFormat( format ) {
		if ( this.isFormatActive( format ) ) {
			this.editor.formatter.remove( format );
		} else {
			this.editor.formatter.apply( format );
		}
	}

	render() {
		const { tagName: Tag = 'div', style, className } = this.props;
		const classes = classnames( 'blocks-editable', className );

		let element = (
			<Tag
				ref={ this.bindNode( 'editor' ) }
				style={ style }
				className={ classes }
				key="editor" />
		);

		if ( this.state.isFocused ) {
			element = [
				<Fill name="Formatting.Toolbar" key="fill">
					<Toolbar
						ref={ this.bindNode( 'toolbar' ) }
						controls={ formattingControls.map( ( control ) => ( {
							...control,
							onClick: () => this.toggleFormat( control.format ),
							isActive: this.isFormatActive( control.format )
						} ) ) } />
				</Fill>,
				element
			];
		}

		return element;
	}
}
