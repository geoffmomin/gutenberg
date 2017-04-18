/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import './style.scss';

export default class TinyMCEEditable extends wp.element.Component {
	constructor() {
		super( ...arguments );
		this.onInit = this.onInit.bind( this );
		this.onSetup = this.onSetup.bind( this );
		this.onChange = this.onChange.bind( this );
		this.bindNode = this.bindNode.bind( this );
	}

	componentDidMount() {
		this.initialize();
	}

	initialize() {
		const config = {
			selector: 'div.tinymce',
			target: this.node,
			theme: 'inlite',
			inline: true,
			plugins: 'image table link paste contextmenu textpattern autolink',
			insert_toolbar: 'blockquote bullist numlist | quickimage quicktable',
			selection_toolbar: 'bold italic | quicklink h2 h3 blockquote',
			paste_data_images: true,
			advlist_bullet_styles: [ {
				title: 'Default',
				styles: {
					listStyleType: '',
					listStyleImage: ''
				}
			}, {
				title: 'Circle',
				styles: {
					listStyleType: 'circle',
					listStyleImage: ''
				}
			}, {
				title: 'Disc',
				styles: {
					listStyleType: 'disc',
					listStyleImage: ''
				}
			}, {
				title: 'Square',
				styles: {
					listStyleType: 'square',
					listStyleImage: ''
				}
			} ],
			browser_spellcheck: true,
			entity_encoding: 'raw',
			setup: this.onSetup
		};

		tinymce.init( config );
	}

	onSetup( editor ) {
		this.editor = editor;
		editor.on( 'init', this.onInit );
		editor.on( 'focusout', this.onChange );
	}

	onInit() {
		const { value = '' } = this.props;
		this.editor.setContent( value );
	}

	onChange() {
		if ( ! this.editor.isDirty() ) {
			return;
		}
		const value = this.editor.getContent();
		this.editor.save();
		this.props.onChange( value );
	}

	bindNode( ref ) {
		this.node = ref;
	}

	updateContent() {
		const bookmark = this.editor.selection.getBookmark( 2, true );
		this.editor.setContent( this.props.value );
		this.editor.selection.moveToBookmark( bookmark );
	}

	componentWillUpdate( nextProps ) {
		if ( this.editor && this.props.tagName !== nextProps.tagName ) {
			this.editor.destroy();
		}
	}

	componentWillUnmount() {
		if ( this.editor ) {
			this.editor.destroy();
		}
	}

	componentDidUpdate( prevProps ) {
		if ( this.props.tagName !== prevProps.tagName ) {
			this.initialize();
		} else if ( this.props.value !== prevProps.value ) {
			this.updateContent();
		}
	}

	render() {
		const { tagName: Tag = 'div', style, className } = this.props;
		const classes = classnames( 'blocks-editable', className );

		return (
			<Tag
				ref={ this.bindNode }
				style={ style }
				className={ classes } />
		);
	}
}
